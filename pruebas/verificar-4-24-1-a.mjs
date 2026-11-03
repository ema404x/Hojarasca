// 4.24.1 (A): la trochita y el mapa a ojo. Lo que se hizo, con comprobación de que antes fallaba (cada arreglo tiene su mutación: la misma prueba sobre una copia de
// src/ con el arreglo deshecho tiene que fallar):
//   1. el viaje de vuelta en trochita sin la espera larga: en el andén de la Aldea de los Duendes, de regreso de las diligencias (te alejaste más de 30 m y volvés), con
//      más de 45 s de espera y un viaje ya hecho, Elsa toca la campana y el tren aparece a 135 m del poste (la misma `traerAlAnden` de la 4.24.0, con la parada de la Aldea)
//   2. el mapa y el panel a ojo (ver las secciones de abajo)
//   3. «Lo prestado» del capítulo 11 (ver más abajo)
// Las mutaciones corren cada una en su proceso sobre una copia de src/ (el caché de ESM engaña si no).
import { readFileSync, writeFileSync, rmSync, cpSync, mkdtempSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { H, D, ES, E, ESC, TODOS_EF, imp, nuevaPartida, crearJuego } from './ayuda-4-18-4-historia.mjs';
import { enUnaLinea } from './ayuda-codigo.mjs';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.env.A4184_SRC || join(raiz, 'src');
const leer = (f) => readFileSync(join(SRC, f), 'utf8');
const HIJO = !!process.env.A4184_SRC;
const SEC = process.env.A4241_SECCIONES ? new Set(process.env.A4241_SECCIONES.split(',')) : null;
const va = (s) => !SEC || SEC.has(s);
let n = 0, fallas = 0;
const ok = (c, t) => { n++; if (!c) { fallas++; if (!process.env.A4241_CALLADO) console.log('FALLA ' + t); } };

const main = leer('main.js'), trochita = leer('trochita.js');
const IDS = H.CAPITULOS.map((c) => c.id);
// una partida de mentira en el capítulo `cap` (id), con lo anterior cerrado
function armar(cap, o = {}) {
  const { P, X } = nuevaPartida();
  const h = P.historia, idx = IDS.indexOf(cap);
  IDS.slice(0, idx).forEach((k) => { h.cerrados[k] = 1; });
  Object.assign(h, { activa: true, capitulo: idx, fase: o.fase || 'jugando', empezada: 1 });
  for (const e of o.vistas || []) h.escenas.vistas[e] = 1;
  for (const k of o.hechos || []) h.hechos[`${cap}:${k}`] = 1;
  P.horas = o.horas ?? 12; P.dia = o.dia ?? 5;
  h.base = { dia: o.baseDia ?? 5 };
  Object.assign(X, o.extra || {});
  return { P, X, h, s: () => H.estadoHistoria(P, X) };
}

// ---------------------------------------------------------------- 1. el viaje de vuelta sin espera
function anidada(fuente, nombre) {
  const i0 = fuente.indexOf(`\n  function ${nombre}(`);
  if (i0 < 0) throw new Error('no está ' + nombre);
  const i1 = fuente.indexOf('\n  }\n', i0);
  return fuente.slice(i0 + 1, i1 + 5);
}
// la trochita de verdad (las funciones sacadas de trochita.js) con una parada cualquiera de la vuelta
function trenDeMentira(est, o = {}) {
  const total = o.total ?? 2303, poste = (p) => p.s + (o.adelanto ?? 4);
  const codigo = `const delta = (a, b) => { let d = b - a; while (d < 0) d += total; while (d > total) d -= total; return d; };\n${anidada(trochita, 'proximoTrenA')}\n${anidada(trochita, 'esperaEnAnden')}\n${anidada(trochita, 'traerAlAnden')}\nreturn { proximoTrenA, esperaEnAnden, traerAlAnden };`;
  const f = new Function('est', 'total', 'poste', codigo)(est, total, poste);
  return { ...f, estacion: { s: 600 }, aldea: { s: o.sAldea ?? 1180, aldea: true }, total, poste };
}
const estTren = (o = {}) => ({ s: 0, vel: 7, objetivo: 7, parado: 0, proxima: null, subido: false, conduce: false, varado: false, avisoSilbato: true, frenos: 3, ...o });
if (va('vuelta')) {
  // --- la misma trochita, con la parada de la Aldea
  { const e = estTren({ s: 1240 }); const t = trenDeMentira(e);   // recién salió de la Aldea: el poste queda ~2250 m atrás
    const antes = t.esperaEnAnden(t.aldea);
    ok(antes > 300, `recién salido de la Aldea, el tren tarda más de 5 minutos en volver (${antes} s)`);
    ok(t.traerAlAnden(t.aldea) === true, 'se lo trae al andén de la Aldea');
    ok(Math.abs(t.poste(t.aldea) - e.s - 135) < 1e-9, 'queda a 135 m del poste de la Aldea');
    ok(e.proxima === t.aldea && e.parado === 0 && e.vel > 0, 'en marcha y con la Aldea por delante');
    ok(t.esperaEnAnden(t.aldea) <= 25 && t.esperaEnAnden(t.aldea) >= 15, `y llega en ${t.esperaEnAnden(t.aldea)} s (antes: ${antes} s)`); }
  { const e = estTren({ s: 1184, vel: 0, parado: 40 }); const t = trenDeMentira(e); ok(t.esperaEnAnden(t.aldea) === 0 && t.traerAlAnden(t.aldea) === false && e.s === 1184, 'parado en la Aldea no se lo toca'); }
  { const e = estTren({ s: 100, subido: true }); const t = trenDeMentira(e); ok(t.traerAlAnden(t.aldea) === false && e.s === 100, 'con alguien arriba no se lo toca'); }
  { const e = estTren({ s: 100, varado: true }); const t = trenDeMentira(e); ok(t.traerAlAnden(t.aldea) === false && e.s === 100, 'ni si está varado'); }

  // --- el estado y el disparador
  { const a = armar('bolsa'); ok(a.s().esperaAldea === 0, 'sin dato del tren la espera de la Aldea es 0');
    a.X.esperaAldea = 90.4; ok(a.s().esperaAldea === 90, 'la espera se redondea');
    a.X.esperaAldea = -5; ok(a.s().esperaAldea === 0, 'una espera negativa vale 0');
    a.X.esperaAldea = 'x'; ok(a.s().esperaAldea === 0, 'y una que no es número');
    a.X.esperaAldea = 1e9; ok(a.s().esperaAldea === 9999, 'y tiene tope');
    ok(a.s().esperaTren === 0, 'la de la estación no se mezcla'); }
  const quien = (a) => D.escenaPendiente(a.h, a.s(), {});
  const base = (o = {}) => { const a = armar('bolsa', { horas: 10, extra: { lugares: { 'aldea': 8 }, esperaAldea: 120, ...(o.extra || {}) }, vistas: o.vistas, fase: o.fase }); a.P.entradas.viaje = o.sinViaje ? undefined : { cantidad: 1 }; if (o.sinViaje) delete a.P.entradas.viaje; return a; };
  { const a = base(); ok(quien(a) === 'elsa-anden-vuelta', 'en el andén de la Aldea, en el capítulo 2, con un viaje hecho y 120 s por delante: sale la escena de Elsa'); }
  { const a = base({ extra: { esperaAldea: D.ESPERA_MAXIMA_TREN } }); ok(quien(a) !== 'elsa-anden-vuelta', 'con 45 s justos todavía no'); }
  { const a = base({ extra: { esperaAldea: D.ESPERA_MAXIMA_TREN + 1 } }); ok(quien(a) === 'elsa-anden-vuelta', 'con 46 s sí'); }
  { const a = base({ extra: { esperaAldea: 0 } }); ok(quien(a) !== 'elsa-anden-vuelta', 'si el tren ya está en el andén (o todavía no te alejaste) no hace falta'); }
  { const a = base({ extra: { lugares: { 'aldea': 30 } } }); ok(quien(a) !== 'elsa-anden-vuelta', 'lejos del andén (30 m) no'); }
  { const a = base({ extra: { lugares: { 'aldea': 12 } } }); ok(quien(a) === 'elsa-anden-vuelta', 'a 12 m sí'); }
  { const a = base({ extra: { lugares: {} } }); ok(quien(a) !== 'elsa-anden-vuelta', 'sin saber dónde estás no'); }
  { const a = base({ sinViaje: true }); ok(quien(a) !== 'elsa-anden-vuelta', 'sin un viaje hecho no sale (la ida es la otra escena)'); }
  { const a = base({ vistas: ['elsa-anden-vuelta'] }); ok(quien(a) !== 'elsa-anden-vuelta', 'una sola vez'); }
  { const a = base(); a.P.horas = 5.5; ok(quien(a) !== 'elsa-anden-vuelta', 'de madrugada Elsa no está'); a.P.horas = 21.2; ok(quien(a) !== 'elsa-anden-vuelta', 'ni a la noche'); a.P.horas = 6.1; ok(quien(a) === 'elsa-anden-vuelta', 'a la mañana sí'); }
  for (const c of IDS) { if (c === 'bolsa') continue; const a = armar(c, { horas: 10, extra: { lugares: { 'aldea': 8 }, esperaAldea: 120 } }); a.P.entradas.viaje = { cantidad: 1 }; ok(quien(a) !== 'elsa-anden-vuelta', `en el capítulo «${c}» no sale`); }
  { const a = base({ fase: 'intro' }); ok(quien(a) === null, 'con la tarjeta de entrada todavía no'); }
  // la de la ida no se tocó
  { const a = armar('bolsa', { horas: 10, extra: { lugares: { estacion: 10 }, esperaTren: 120 } }); ok(quien(a) === 'elsa-anden', 'la escena de la ida, en la estación, sigue saliendo'); }
  { const a = armar('bolsa', { horas: 10, extra: { lugares: { estacion: 10, 'aldea': 8 }, esperaTren: 120, esperaAldea: 120 } }); a.P.entradas.viaje = { cantidad: 1 }; ok(quien(a) === 'elsa-anden-vuelta', 'con el viaje hecho, en la Aldea, sólo la de la vuelta'); }
  ok(D.LUGARES_HISTORIA.includes('aldea') && D.DISPARADORES['elsa-anden-vuelta'].lugar[0] === 'aldea', 'el andén de la Aldea es el punto «aldea» (su parada): no suma un lugar nuevo a la historia');
  ok(D.ESCENAS_ACTO1_IDS.includes('elsa-anden-vuelta') && Object.hasOwn(ESC, 'elsa-anden-vuelta'), 'la escena está en el acto I y en el director');
  ok(!Object.values(H.CAPITULO.bolsa.objetivos).some((o) => String(o.hecho || '').includes('elsa-anden-vuelta')), 'no es un objetivo: nada se traba si no sale');

  // --- la escena corre y trae el tren una sola vez (también si se la saltea)
  const e = ESC['elsa-anden-vuelta'];
  ok(e && e.capitulo === 2 && e.acto === 1 && e.resumen.length > 60 && !/lazo/i.test(e.resumen), 'la escena es del capítulo 2 y tiene reseña');
  ok(e.pasos.filter((p) => p.tipo === 'dialogo' && p.quien !== 'narra').reduce((s, p) => s + p.lineas.length, 0) <= 3, 'es corta: tres líneas de Elsa o menos');
  ok(!e.pasos.some((p) => p.tipo === 'eleccion'), 'sin elecciones: no hace perder tiempo');
  ok(e.pasos.some((p) => p.tipo === 'efecto' && p.nombre === 'mundo:tren-al-aldea'), 'trae el tren con un efecto del mundo');
  ok(JSON.stringify(e.pasos).includes('"lugar":"aldea"') && !JSON.stringify(e.pasos).includes('"lugar":"estacion"'), 'todo anclado al andén de la Aldea, no al de la estación');
  { const i = e.pasos.findIndex((p) => p.tipo === 'efecto' && p.nombre === 'mundo:tren-al-aldea');
    const antes = e.pasos.slice(0, i), despues = e.pasos.slice(i + 1);
    ok([...antes].reverse().find((p) => p.tipo === 'fundido')?.a === 'negro', 'el efecto va después de un fundido a negro');
    ok(despues.find((p) => p.tipo === 'fundido')?.a === 'claro', 'y antes de que vuelva la luz'); }
  { // no repite las frases de la de la ida
    const dichas = (x) => x.pasos.filter((p) => p.tipo === 'dialogo').flatMap((p) => p.lineas.map((l) => (typeof l === 'string' ? l : l.texto)));
    const a = new Set(dichas(ESC['elsa-anden']).map((t) => t.toLowerCase()));
    ok(dichas(e).every((t) => !a.has(t.toLowerCase())) && !/opini[oó]n/.test(JSON.stringify(e.pasos)), 'no repite las frases de la escena de la ida'); }
  for (const saltar of [false, true]) {
    const llamadas = [];
    const P = nuevaPartida().P;
    const mundo = { posicion: () => ({ x: 0, z: 0, y: 0 }), suelo: () => 0, camaraJugador: () => ({ x: 0, y: 1.6, z: 0, yaw: 0, pitch: 0, fov: 60 }), horaActual: () => P.horas, puedeEmpezar: () => true, hora() {} };
    const errores = [];
    const dir = ES.crearDirector({ mundo, estado: () => ES.escenasDe(P.historia), dia: () => P.dia, alError: (t) => errores.push(t) });
    dir.registrar(e);
    const ctxEf = { historia: () => P.historia, dia: () => P.dia, estado: () => H.estadoHistoria(P, {}) };
    E.registrarEfectosHistoria(dir, ctxEf);
    E.registrarEfectosActo1(dir, { ...ctxEf, dar() {}, mundo: (id) => llamadas.push(id), duende() {}, quitar() {} }, TODOS_EF);
    ok(dir.disparar('elsa-anden-vuelta') === true, `${saltar ? 'salteada' : 'entera'}: arranca`);
    let t = 0;
    for (let i = 0; i < 4000 && dir.activa(); i++) { dir.actualizar(0.1); const d = dir.datos(); if (d?.dialogo) { dir.acelerar(true); dir.avanzar(); } if (saltar && ++t === 3) { dir.pedirSaltar(); dir.pedirSaltar(); } }
    ok(!dir.activa() && errores.length === 0, `${saltar ? 'salteada' : 'entera'}: termina sin errores (${errores.join()})`);
    ok(llamadas.filter((x) => x === 'tren-al-aldea').length === 1 && !llamadas.includes('tren-al-anden'), `${saltar ? 'salteada' : 'entera'}: el tren se trae una sola vez, y a la Aldea (${llamadas.join()})`);
    ok(Object.hasOwn(P.historia.escenas.vistas, 'elsa-anden-vuelta'), `${saltar ? 'salteada' : 'entera'}: queda vista`);
  }
  { const col = (await imp('historia-colocacion.js')).COLOCACION_PULIDO['elsa-anden-vuelta'];
    ok(col && col.punto === 'aldea' && col.dist === 8 && col.desde === 'plaza', 'el jugador se pone a 8 m del andén de la Aldea, del lado de la plaza'); }

  // --- main.js: el enganche
  ok(!main.includes("aldea-anden"), "main.js no suma un punto nuevo (usa el de la parada de la Aldea que ya existe)");
  ok(enUnaLinea(main, ['esperaAldea: esperaAldeaHistoria()']), 'main.js le pasa a la Historia la espera del tren en la Aldea');
  ok(enUnaLinea(main, ["if (id === 'tren-al-aldea')", 'tren.traerAlAnden(pa)', '!jugador.estado.enTren']), 'main.js trae el tren a la Aldea con el efecto del mundo, y no lo toca si vas arriba');
  ok(enUnaLinea(main, ['function paradaAldeaHist()', 'esDesafio ? null', 'p.aldea']), 'la parada es la de la Aldea, y en el Desafío no hay');
  { // la cuenta de la espera: sólo después de alejarte (> 30 m) y se apaga al subir
    const cuerpo = main.slice(main.indexOf('function esperaAldeaHistoria()'), main.indexOf('function puntosDeHistoria()'));
    const pa = { espera: { x: 0, z: 0 } };
    const crear = () => new Function('jugador', 'tren', 'paradaAldeaHist', `let andenAldeaLejos = false;\n${cuerpo}\nreturn esperaAldeaHistoria;`);
    const js = { pos: { x: 3, z: 3 }, enTren: false }, trenFalso = { esperaEnAnden: () => 400 };
    const f = crear()({ estado: js }, trenFalso, () => pa);
    ok(f() === 0, 'recién bajado, en el andén: la espera es 0');
    js.pos = { x: 20, z: 0 }; ok(f() === 0, 'a 20 m todavía no te alejaste');
    js.pos = { x: 40, z: 0 }; ok(f() === 400, 'a 40 m sí: la espera es la del tren');
    js.pos = { x: 2, z: 0 }; ok(f() === 400, 'y al volver al andén, sigue contando');
    js.enTren = true; ok(f() === 0, 'arriba del tren es 0');
    js.enTren = false; ok(f() === 0, 'y al bajarte hay que volver a alejarte');
    ok(crear()({ estado: js }, trenFalso, () => null)() === 0, 'sin parada de la Aldea (el Desafío) es 0');
    ok(crear()({ estado: null }, trenFalso, () => pa)() === 0, 'sin jugador es 0'); }
}

// ---------------------------------------------------------------- 2. el papel del mapa: nombres de las banderitas y de las chinches en la aldea apretada
if (va('mapa')) {
  const MAPA = await imp('mapa.js'), CFG = await imp('config.js');
  const registro = [];
  const ctxFalso = () => new Proxy({ textAlign: 'center' }, {
    get: (t, k) => (k in t ? t[k] : k === 'measureText' ? (s) => ({ width: String(s).length * 7 }) : k === 'createImageData' ? (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) })
      : (...a) => { registro.push([k, ...a, ...(k === 'fillText' || k === 'strokeText' ? [t.textAlign] : [])]); }),
    set: (t, k, v) => { t[k] = v; return true; },
  });
  const W = 640, lienzo = () => ({ width: W, height: W, getContext: () => ctxFalso() });
  const antes = globalThis.document;
  globalThis.document = { createElement: () => lienzo() };
  try {
    const NN = CFG.N;
    const T = { altura: () => 5, indice: () => 0, agua: () => null, bosque: new Float32Array(1), alturas: new Float32Array(NN * NN), rio: [], riel: [], sendero: [], val: () => 0 };
    const mapa = MAPA.crearMapa(T, null);
    const dibujar = (autom, lugares = {}, chinches = []) => { registro.length = 0; mapa.dibujar(lienzo(), null, { pos: { x: 0, z: 0 }, yaw: 0 }, null, lugares, [], chinches, null, autom); return registro.slice(); };
    const aPx = (x, z) => [((x + 512) / 1024) * W, ((z + 512) / 1024) * W];
    const texto = (r, t, op = 'fillText') => r.filter((x) => x[0] === op && x[1] === t);
    const guias = (r) => r.filter((x) => x[0] === 'setLineDash' && x[1]?.length === 2 && x[1][0] === 3 && x[1][1] === 3).length;
    // una grilla de lugares alrededor de (x, z): tapa los siete lugares de siempre de un nombre, pero deja libre el aire más lejos
    const tapar = (x, z, radioPx, paso = 11) => {
      const L = {}; let k = 0;
      for (let dx = -radioPx; dx <= radioPx; dx += paso) for (let dz = -radioPx; dz <= radioPx; dz += paso) {
        if (Math.hypot(dx, dz) > radioPx) continue;
        L[`t${k++}`] = { x: x + dx * (1024 / W), z: z + dz * (1024 / W), nombre: 'xxxxxx' };
      }
      return L;
    };
    const FX = 100, FZ = 100;
    // --- la banderita sola: el nombre arriba, con su halo, y sin guía
    { const r = dibujar([{ x: FX, z: FZ, nombre: 'Plaza de la aldea', clase: 'objetivo' }]);
      ok(texto(r, 'Plaza de la aldea').length === 1, 'la banderita sola escribe su nombre una vez');
      ok(texto(r, 'Plaza de la aldea', 'strokeText').length === 1, 'con un halo del color del papel (se lee encima de las curvas de nivel y de otros nombres)');
      ok(guias(r) === 0, 'y sin guía: está al lado de su banderita'); }
    // --- la aldea apretada: los siete lugares de siempre ocupados
    { const [px, py] = aPx(FX, FZ);
      const r = dibujar([{ x: FX, z: FZ, nombre: 'Plaza de la aldea', clase: 'objetivo' }], tapar(FX, FZ, 55));
      const t = texto(r, 'Plaza de la aldea');
      ok(t.length === 1, `en la aldea apretada el nombre se escribe igual (${t.length} veces)`);
      if (t.length === 1) {
        const [, , x, y] = t[0];
        ok(Math.hypot(x - px, y - py) > 40, `lejos de los otros nombres: a ${Math.round(Math.hypot(x - px, y - py))} px de la banderita`);
        ok(x > W * 0.05 && x < W * 0.95 && y > W * 0.05 && y < W * 0.93, 'adentro del papel');
        ok(guias(r) === 1, 'unido a la banderita con una guía fina');
        ok(texto(r, 'Plaza de la aldea', 'strokeText').length === 1, 'y con su halo'); } }
    // --- sin lugar en ninguna parte (todo tapado): no se escribe dos veces
    { const r = dibujar([{ x: FX, z: FZ, nombre: 'Plaza de la aldea', clase: 'objetivo' }], tapar(FX, FZ, 330, 9));
      ok(texto(r, 'Plaza de la aldea').length <= 1, 'con todo tapado no se escribe dos veces'); }
    // --- el mismo nombre ya escrito al lado: no se repite (4.24.0)
    { const r = dibujar([{ x: FX, z: FZ, nombre: 'Refugio del Arroyo', clase: 'objetivo' }], { refugio: { x: FX, z: FZ, nombre: 'Refugio del Arroyo' } });
      ok(texto(r, 'Refugio del Arroyo').length === 1, 'si el lugar ya tiene su rótulo, la marca no lo repite'); }
    // --- dos banderitas juntas (la plaza y el almacén): los dos nombres se escriben y no en el mismo lugar
    { const r = dibujar([{ x: FX, z: FZ, nombre: 'Plaza de la aldea', clase: 'objetivo' }, { x: FX + 14, z: FZ - 6, nombre: 'Almacén de Ercilia', clase: 'objetivo' }]);
      const a = texto(r, 'Plaza de la aldea')[0], b = texto(r, 'Almacén de Ercilia')[0];
      ok(a && b && (Math.abs(a[2] - b[2]) > 20 || Math.abs(a[3] - b[3]) > 8), 'dos banderitas juntas: los dos nombres, cada uno en su lugar'); }
    // --- la banderita reserva su lugar: otro nombre no se le escribe encima
    { const [px, py] = aPx(FX, FZ), s = W / 80;
      const r = dibujar([{ x: FX, z: FZ, nombre: 'Plaza de la aldea', clase: 'objetivo' }], { casa: { x: FX + 4, z: FZ - 2, nombre: 'Casa' } });
      const q = texto(r, 'Casa')[0];
      ok(q && !(q[2] > px - 12 && q[2] < px + s * 1.5 + 12 && q[3] > py - s * 2.1 && q[3] < py), 'el nombre de otro lugar no se escribe encima de la banderita'); }
    // --- la chinche: su nombre arriba si entra; si no, a otro lado; una chinche sobre una banderita
    { const [px, py] = aPx(FX, FZ), rr = W / 120;
      const r = dibujar([], {}, [{ x: FX, z: FZ, nombre: 'Chinche 1' }]);
      const t = texto(r, 'Chinche 1');
      ok(t.length === 1 && Math.abs(t[0][2] - px) < 1 && Math.abs(t[0][3] - (py - rr * 2.6)) < 1, 'la chinche sola: el nombre arriba, donde siempre');
      ok(guias(r) === 0, 'sin guía');
      // un lugar cuyo nombre cae justo arriba de la chinche
      const L = { zz: { x: FX, z: FZ - (rr * 2.6 - W / 60) * (1024 / W), nombre: 'ZZZZZZZZZZ' } };
      const r2 = dibujar([], L, [{ x: FX, z: FZ, nombre: 'Chinche 1' }]);
      const t2 = texto(r2, 'Chinche 1');
      ok(t2.length === 1 && (Math.abs(t2[0][2] - px) > 1 || Math.abs(t2[0][3] - (py - rr * 2.6)) > 1), 'con otro nombre justo arriba, el de la chinche se corre');
      // dos chinches, una justo arriba de la otra: el nombre de la de abajo no se escribe encima del cuerpo de la de arriba
      const zArriba = FZ - 3.0 * rr * (1024 / W);
      const r4 = dibujar([], {}, [{ x: FX, z: zArriba, nombre: 'Chinche 2' }, { x: FX, z: FZ, nombre: 'Chinche 1' }]);
      const t4 = texto(r4, 'Chinche 1')[0];
      ok(t4 && (Math.abs(t4[2] - px) > 1 || Math.abs(t4[3] - (py - rr * 2.6)) > 1), 'el nombre de una chinche no se escribe encima del cuerpo de otra');
      const r3 = dibujar([{ x: FX, z: FZ, nombre: 'Plaza de la aldea', clase: 'objetivo' }], tapar(FX, FZ, 55), [{ x: FX, z: FZ, nombre: 'Chinche 1' }]);
      const a = texto(r3, 'Plaza de la aldea')[0], b = texto(r3, 'Chinche 1')[0];
      ok(a && b && (Math.abs(a[2] - b[2]) > 20 || Math.abs(a[3] - b[3]) > 10), 'una chinche encima de una banderita en la aldea apretada: los dos nombres se leen, cada uno en su lugar'); }
  } finally { globalThis.document = antes; }
}

// ---------------------------------------------------------------- 3. el panel: «Lo prestado» con su contador y las optativas que entren
const MK = await imp('historia-marca.js');
const PUNTOS = Object.fromEntries(Object.keys(MK.PUNTOS_MARCA).map((k, i) => [k, { x: 10 + i * 7, z: -40 + i * 5 }]));
if (va('panel')) {
  const panelDe = (cap, hechos = []) => { const a = armar(cap, { hechos }); return H.panelHistoria(a.h, a.s()); };
  // --- panelHistoria entrega lo que va y la meta
  { const p = panelDe('arco'); const o = p.objetivos.find((x) => x.id === 'prestado');
    ok(o.meta === 3 && Array.isArray(o.avance) && o.avance[1] === 3 && o.avance[0] >= 0 && o.avance[0] <= 3, `el objetivo trae su avance (${JSON.stringify(o.avance)}) y su meta`);
    ok(/ \(\d\/3\)$/.test(o.texto), 'y el texto sigue diciendo su cuenta, como siempre');
    ok(p.objetivos.find((x) => x.id === 'lado').avance === undefined, 'los objetivos sin cuenta no traen avance');
    const hecho = panelDe('arco', ['prestado']).objetivos.find((x) => x.id === 'prestado');
    ok(hecho.hecho === true && hecho.meta === 3 && hecho.avance === undefined, 'cumplido: la meta y sin avance'); }
  // --- las filas: lo prestado, una cadena con su contador
  { const p = panelDe('arco'); const filas = MK.filasDelPanel('arco', p.objetivos);
    const f = filas.find((x) => x.id === 'prestado');
    ok(f && f.tipo === 'cadena' && f.titulo === 'Lo prestado' && f.total === 3 && f.hechos === p.objetivos.find((x) => x.id === 'prestado').avance[0], 'lo prestado es una cadena con su contador («N de 3»)');
    ok(f.items.length === 1 && f.items[0].id === 'prestado' && !/\(\d\/3\)/.test(f.items[0].texto) && /Pedí defensas prestadas/.test(f.items[0].texto), 'la línea ya no repite su cuenta');
    ok(f.resto === 0, 'sin «y N pasos más»');
    const c = MK.filasDelPanel('arco', p.objetivos, { compacto: true }).find((x) => x.tipo === 'objetivo' && x.o.id === 'prestado');
    ok(!!c && /\(\d\/3\)$/.test(c.o.texto), 'con poco lugar vuelve a ser la línea suelta, con su cuenta (no suma una línea de título)');
    ok(filas.filter((x) => x.tipo === 'objetivo').map((x) => x.o.id).join() === 'lado', 'sólo el lado del arroyo queda suelto'); }
  { const f = MK.filasDelPanel('arco', panelDe('arco', ['prestado']).objetivos).find((x) => x.id === 'prestado');
    ok(f.hechos === 3 && f.total === 3 && f.items.length === 0, 'cumplido: «3 de 3» y sin línea'); }
  { // sin avance (otro llamador): la meta sola
    const f = MK.filasDelPanel('arco', [{ id: 'prestado', texto: 'x (1/3)', tecla: 'E', hecho: false, meta: 3 }]).find((x) => x.id === 'prestado');
    ok(f && f.hechos === 0 && f.total === 3, 'sin avance, empieza en 0');
    const g = MK.filasDelPanel('arco', [{ id: 'prestado', texto: 'x', tecla: 'E', hecho: false }]).find((x) => x.id === 'prestado');
    ok(g && g.total === 1 && g.hechos === 0, 'sin meta ni avance no se rompe');
    const h = MK.filasDelPanel('arco', [{ id: 'prestado', texto: 'x (9/3)', tecla: 'E', hecho: false, meta: 3, avance: [9, 3] }]).find((x) => x.id === 'prestado');
    ok(h.hechos === 3, 'el avance no pasa de la meta');
    ok(MK.filasDelPanel('nevada', [{ id: 'prestado', texto: 'x', tecla: 'E', hecho: false }]).every((x) => x.tipo === 'objetivo'), 'en otro capítulo no es cadena'); }
  // --- el panel real
  const cuentaP = (t) => (t.match(/<p/g) || []).length;
  const juego = (cap, op = {}) => {
    const a = armar(cap, op); a.P.cosas = a.P.cosas || {}; if (op.cosas) Object.assign(a.P.cosas, op.cosas);
    if (op.trato) a.h.duendes = { ...(a.h.duendes || {}), trato: op.trato };
    if (op.optativas) a.h.optativas = { ...(a.h.optativas || {}), ...op.optativas };
    const J = crearJuego({ P: a.P, X: a.X }); J.ctx.puntoDe = (k) => (Object.hasOwn(PUNTOS, k) ? PUNTOS[k] : null);
    return { a, J, panel: J.ctx.documento.body.children.find((c) => c.id === 'historia-hud') };
  };
  const ABIERTAS = { optativas: { 'papel-elsa': 5 }, vistas: ['ramon-cama', 'ramon-sanitario', 'tito-arco'], trato: 'trato', cosas: { 'llave-79': 1 }, extra: { amor: true, cumple: { donde: 'plaza', edificio: 'plaza', claves: ['ercilia'], punto: { x: 1, z: 1 } } } };
  { const g = juego('arco', { hechos: ['lenga'], ...ABIERTAS }); g.J.ctx.documento.defaultView = { innerHeight: 100000 };
    g.panel.getBoundingClientRect = () => ({ bottom: 20 * cuentaP(g.panel.innerHTML) });
    g.J.valle.revisarAhora();
    const html = g.panel.innerHTML;
    ok(/<div class="cadena"><div class="cadena-t"><span>Lo prestado<\/span><i>\d de 3<\/i><\/div>/.test(html), 'el panel dice «Lo prestado · N de 3»');
    ok(/<kbd>E<\/kbd>Pedí defensas prestadas: Anselmo \(estacas\), Guido \(miel\), Martín \(la campana\) y Elsa \(durmientes\); alcanzan tres<\/p>/.test(html), 'y la línea sin su cuenta repetida');
    const total = (html.match(/<div class="optativas">[\s\S]*$/)?.[0].match(/<p/g) || []).length;
    ok(total >= 5, `con las optativas abiertas hay varias en el panel (${total})`);
    // el lugar va faltando: las optativas se van de a una, nunca de golpe; los objetivos sueltos nunca
    const vistas = [];
    for (const alto of [100000, ...Array.from({ length: 160 }, (_, i) => 1000 - i * 6)]) {
      const q = juego('arco', { hechos: ['lenga'], ...ABIERTAS }); q.J.ctx.documento.defaultView = { innerHeight: alto };
      q.panel.getBoundingClientRect = () => ({ bottom: 20 * cuentaP(q.panel.innerHTML) });
      q.J.valle.revisarAhora();
      const h2 = q.panel.innerHTML, bloque = h2.match(/<div class="optativas">[\s\S]*$/)?.[0] || '';
      vistas.push({ alto, n: (bloque.match(/<p(?! class="mas")/g) || []).length, mas: /y \d+ optativas? más/.test(bloque), suelto: /Recorré el lado del arroyo/.test(h2) });
    }
    ok(vistas.every((v) => v.suelto), 'el objetivo suelto no se esconde nunca');
    ok(vistas.every((v, i) => i === 0 || v.n <= vistas[i - 1].n), 'a medida que falta lugar, las optativas se van sin volver');
    const parcial = vistas.filter((v) => v.n > 0 && v.mas);
    ok(parcial.length > 0 && Math.max(...parcial.map((v) => v.n)) < total, `hay tamaños en que entran algunas y el panel dice cuántas quedaron afuera (de ${total}: ${[...new Set(parcial.map((v) => v.n))].join(', ')})`);
    ok(vistas[0].n === total && !vistas[0].mas, 'con lugar de sobra, todas y sin «y N más»');
    ok(vistas[vistas.length - 1].n === 0, 'y con muy poco, ninguna');
    // las que faltan primero
    if (parcial.length) {
      const medio = parcial[0]; const q = juego('arco', { hechos: ['lenga'], ...ABIERTAS }); q.J.ctx.documento.defaultView = { innerHeight: medio.alto };
      q.panel.getBoundingClientRect = () => ({ bottom: 20 * cuentaP(q.panel.innerHTML) }); q.J.valle.revisarAhora();
      ok(!/<kbd>✓<\/kbd>/.test(q.panel.innerHTML.match(/<div class="optativas">[\s\S]*$/)?.[0] || ''), 'con poco lugar se ven primero las que faltan'); }
  }
}

// ---------------------------------------------------------------- 4. los botones «Cerrar» del mapa y del cuaderno con las teclas del jugador
if (va('teclas')) {
  const { funcion } = await import('./ayuda-codigo.mjs');
  const boton = (texto) => ({ textContent: texto, dataset: {} });
  const armarEntorno = (propias) => {
    const botones = { 'cerrar-mapa': boton('Cerrar (M)'), 'cerrar-cuaderno': boton('Cerrar (J)') };
    return { botones, e: { document: { querySelectorAll: () => [] }, $: (id) => botones[id] || null, teclaVisible: (t) => propias[t] || t, teclasPropias: {}, T_: (t) => t } };
  };
  { const { botones, e } = armarEntorno({});
    funcion(main, 'pintarTeclasPropias', e)();
    ok(botones['cerrar-mapa'].textContent === 'Cerrar (M)' && botones['cerrar-cuaderno'].textContent === 'Cerrar (J)', 'con las teclas de fábrica los botones quedan como estaban'); }
  { const { botones, e } = armarEntorno({ M: 'U', J: 'G' });
    funcion(main, 'pintarTeclasPropias', e)();
    ok(botones['cerrar-mapa'].textContent === 'Cerrar (U)' && botones['cerrar-cuaderno'].textContent === 'Cerrar (G)', 'con el mapa en la U y el cuaderno en la G, los botones dicen «Cerrar (U)» y «Cerrar (G)»'); }
  { const { botones, e } = armarEntorno({ M: 'U' }); const pintar = funcion(main, 'pintarTeclasPropias', e);
    pintar(); ok(botones['cerrar-mapa'].textContent === 'Cerrar (U)' && botones['cerrar-cuaderno'].textContent === 'Cerrar (J)', 'cada botón con su tecla');
    pintar(); ok(botones['cerrar-mapa'].textContent === 'Cerrar (U)', 'pintar de nuevo no lo rompe');
    delete e.teclaVisible; e.teclaVisible = (t) => t; pintar();
    ok(botones['cerrar-mapa'].textContent === 'Cerrar (M)', 'y al volver a la tecla de fábrica, vuelve el texto de siempre'); }
}

// ---------------------------------------------------------------- las mutaciones
const MUT = [
  ['historia-disparadores.js', "cond: (s) => !!s.viaje && s.esperaAldea > ESPERA_MAXIMA_TREN },", "cond: (s) => s.esperaAldea > ESPERA_MAXIMA_TREN },", 'Elsa apura al tren de vuelta sin que hayas viajado', 'vuelta'],
  ['historia-disparadores.js', "cond: (s) => !!s.viaje && s.esperaAldea > ESPERA_MAXIMA_TREN },", "cond: (s) => !!s.viaje },", 'Elsa apura al tren de vuelta aunque ya esté en el andén', 'vuelta'],
  ['historia-disparadores.js', "lugar: en('aldea', 12), hora: [6, 21],", "hora: [6, 21],", 'Elsa apura al tren de vuelta desde cualquier parte', 'vuelta'],
  ['historia-disparadores.js', "lugar: en('aldea', 12), hora: [6, 21],", "lugar: en('aldea', 30), hora: [6, 21],", 'el radio del andén de la Aldea es de 30 m', 'vuelta'],
  ['historia-disparadores.js', "lugar: en('aldea', 12), hora: [6, 21],", "lugar: en('aldea', 12),", 'Elsa apura al tren de vuelta también de noche', 'vuelta'],
  ['historia-disparadores.js', "'elsa-anden-vuelta': { cap: 'bolsa', modo: 'auto',", "'elsa-anden-vuelta': { cap: ['bolsa', 'mesa'], modo: 'auto',", 'la escena de vuelta también sale en el capítulo 3', 'vuelta'],
  ['historia-disparadores.js', "'te-graciela', 'elsa-anden', 'elsa-anden-vuelta'];", "'te-graciela', 'elsa-anden'];", 'la escena de vuelta no está en el acto I', 'vuelta'],
  ['historia.js', "    esperaAldea: Number.isFinite(Number(extra.esperaAldea)) ? Math.max(0, Math.min(9999, Math.round(Number(extra.esperaAldea)))) : 0,", "    esperaAldea: 0,", 'la Historia no sabe cuánto falta el tren en la Aldea', 'vuelta'],
  ['historia-escenas-acto1.js', "    ...apagon([efecto('mundo:tren-al-aldea'), desaparece('elsa'), espera(0.6)]),", "    efecto('mundo:tren-al-aldea'), desaparece('elsa'),", 'el tren aparece sin fundido a la vista de todos', 'vuelta'],
  ['historia-escenas-acto1.js', "    ...apagon([efecto('mundo:tren-al-aldea'), desaparece('elsa'), espera(0.6)]),", "    ...apagon([desaparece('elsa'), espera(0.6)]),", 'la escena de vuelta no trae el tren', 'vuelta'],
  ['historia-escenas-acto1.js', "    ...apagon([efecto('mundo:tren-al-aldea'), desaparece('elsa'), espera(0.6)]),", "    ...apagon([efecto('mundo:tren-al-anden'), desaparece('elsa'), espera(0.6)]),", 'la escena de vuelta trae el tren a la estación', 'vuelta'],
  ['historia-escenas-acto1.js', "    sonido('campana', { en: { lugar: 'aldea' } }),", "    sonido('campana', { en: { lugar: 'estacion' } }),", 'la campana suena en la estación', 'vuelta'],
  ['historia-escenas-acto1.js', "    aparece('elsa', { lugar: 'aldea', dx: 3, dz: 2 }),", "    aparece('elsa', { lugar: 'estacion', dx: 3, dz: 2 }),", 'Elsa aparece en la estación', 'vuelta'],
  ['historia-colocacion.js', "  'elsa-anden-vuelta': { punto: 'aldea', dist: 8, desde: 'plaza', alto: -0.05 },", "", 'la escena de vuelta no pone al jugador en el andén', 'vuelta'],
  ['main.js', "  if (Math.hypot(js.pos.x - pa.espera.x, js.pos.z - pa.espera.z) > 30) andenAldeaLejos = true;\n  return andenAldeaLejos ? tren.esperaEnAnden(pa) : 0;", "  return tren.esperaEnAnden(pa);", 'main.js cuenta la espera apenas bajás en la Aldea', 'vuelta'],
  ['main.js', "  if (js.enTren) { andenAldeaLejos = false; return 0; }", "  if (js.enTren) return 0;", 'main.js no se acuerda de que viajaste', 'vuelta'],
  ['main.js', "esperaAldea: esperaAldeaHistoria() }; },", "esperaAldea: 0 }; },", 'main.js no pasa la espera de la Aldea', 'vuelta'],
  ['main.js', "if (id === 'tren-al-aldea') { try { const pa = paradaAldeaHist(); if (!jugador.estado.enTren && pa) tren.traerAlAnden(pa); }", "if (id === 'tren-al-aldea') { try { const pa = paradaAldeaHist(); if (false) tren.traerAlAnden(pa); }", 'main.js no trae el tren a la Aldea', 'vuelta'],
  ['main.js', "if (id === 'tren-al-aldea') { try { const pa = paradaAldeaHist(); if (!jugador.estado.enTren && pa) tren.traerAlAnden(pa); }", "if (id === 'tren-al-aldea') { try { const pa = paradaAldeaHist(); if (pa) tren.traerAlAnden(pa); }", 'main.js trae el tren aunque vayas arriba', 'vuelta'],
  ['main.js', "function paradaAldeaHist() { return esDesafio ? null : tren?.paradas?.find((p) => p.aldea) || null; }", "function paradaAldeaHist() { return tren?.paradas?.find((p) => p.aldea) || null; }", 'en el Desafío hay parada de la Aldea', 'vuelta'],
  ['mapa.js', "        if (i === lugaresTexto.length && marca) { if (rotularLejos(texto, alto, a, marca)) return; }\n", "", 'en la aldea apretada el nombre de la banderita no busca lugar más lejos', 'mapa'],
  ['mapa.js', "      if (halo > 0) { ctx.save();", "      if (false) { ctx.save();", 'el nombre de la marca no lleva halo de papel', 'mapa'],
  ['mapa.js', "ocupados.push([qx - s * 0.4, qx + s * 1.6, qy - s * 2.1, qy + s * 0.6, null]); continue; }", "continue; }", 'otro nombre se escribe encima de la banderita', 'mapa'],
  ['mapa.js', "      rotular(c.nombre, px, py, r * 2.6, W / 46, false, { ax: px, ay: py - r * 1.4, guia: 'rgba(58, 38, 20, 0.7)' });", "      ctx.fillText(c.nombre, px, py - r * 2.6);", 'el nombre de la chinche se escribe encima de cualquier otro', 'mapa'],
  ['mapa.js', "      ocupados.push([px - r * 1.3, px + r * 1.3, py - r * 1.95, py + r * 1.7, null]);\n", "", 'otro nombre se escribe encima de la chinche', 'mapa'],
  ['mapa.js', "          if (Math.hypot(gx - marca.ax, gy - marca.ay) > alto * 0.5) {", "          if (false) {", 'el nombre lejano no lleva guía hasta la banderita', 'mapa'],
  ['mapa.js', "      for (const k of [2.2, 3.2, 4.4, 5.8]) {", "      for (const k of [2.2]) {", 'el nombre sólo busca lugar en el primer anillo', 'mapa'],
  ['historia-marca.js', "objetivos: ['prestado'], contador: 'cuenta' },", "objetivos: ['prestado'] },", 'lo prestado vuelve a ser una línea suelta', 'panel'],
  ['historia-marca.js', "g.contador === 'cuenta' && miembros.length === 1 && !compacto) {", "g.contador === 'cuenta' && miembros.length === 1) {", 'con poco lugar lo prestado suma una línea de título', 'panel'],
  ['historia-marca.js', ".replace(/ \\(\\d+\\/\\d+\\)/, '') }], resto: 0 });", ".replace(/ZZZ/, '') }], resto: 0 });", 'la línea de lo prestado repite su cuenta', 'panel'],
  ['historia-marca.js', "Math.min(total, Math.floor(Number(o.avance?.[0]) || 0))", "0", 'el contador de lo prestado no avanza', 'panel'],
  ['historia.js', "...(avance ? { avance } : {}) };", "};", 'panelHistoria no entrega el avance', 'panel'],
  ['historia.js', "...(o.cuenta ? { meta: o.meta || 1 } : {}), ", "", 'panelHistoria no entrega la meta', 'panel'],
  ['historia-ui.js', "for (; n >= 1; n--) {", "for (; n >= 100; n--) {", 'las optativas se van todas de golpe', 'panel'],
  ['historia-ui.js', "sort((a, b) => (a.hecho ? 1 : 0) - (b.hecho ? 1 : 0))", "sort(() => 0)", 'con poco lugar se ven primero las hechas', 'panel'],
  ['historia-ui.js', "${todas.length > lista.length ? `<p class=\"mas\">y ${todas.length - lista.length} ${todas.length - lista.length === 1 ? 'optativa más' : 'optativas más'}</p>` : ''}", "", 'el panel no dice cuántas optativas quedaron afuera', 'panel'],
  ['main.js', "    if (visible !== tecla) { const t = fabrica.replace(", "    if (false) { const t = fabrica.replace(", 'los botones «Cerrar» no siguen la tecla del jugador', 'teclas'],
  ['main.js', "['cerrar-cuaderno', 'J']]", "['cerrar-cuaderno', 'K']]", 'el botón del cuaderno sigue otra tecla', 'teclas'],
];
let atrapadas = 0;
if (!HIJO) {
  const tmp = mkdtempSync(join(tmpdir(), 'a4241a-'));
  try {
    for (const [arch, de, a, que, secc] of MUT) {
      const orig = leer(`${arch}`);
      if (!orig.includes(de)) { ok(false, `mutación inaplicable: ${que}`); continue; }
      const dir = join(tmp, `m${atrapadas}-${Math.random().toString(36).slice(2, 7)}`, 'src');
      mkdirSync(dirname(dir), { recursive: true });
      cpSync(join(raiz, 'src'), dir, { recursive: true });
      writeFileSync(join(dir, arch), orig.replace(de, () => a));
      const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, A4184_SRC: dir, A4241_CALLADO: '1', A4241_SECCIONES: secc }, encoding: 'utf8', timeout: 240000 });
      if (r.status !== 0) atrapadas++; else console.log(`NO ATRAPADA: ${que}`);
      rmSync(dirname(dir), { recursive: true, force: true });
    }
  } finally { rmSync(tmp, { recursive: true, force: true }); }
  ok(atrapadas === MUT.length, `las mutaciones se atrapan (${atrapadas} de ${MUT.length})`);
}

if (!HIJO) console.log(fallas ? `FALLÓ: ${fallas} de ${n}` : `OK 4.24.1 (A) la trochita de vuelta sin espera y el mapa a ojo · ${n} comprobaciones · ${atrapadas} mutaciones atrapadas`);
process.exit(fallas ? 1 : 0);
