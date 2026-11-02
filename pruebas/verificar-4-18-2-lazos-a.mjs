// 4.18.2 (A): la mecánica del lazo de los vecinos que no lo tenían (Rosa, Tobías, Tito, Belisario, Herminia, Nicanor y Sofía). Se mira:
//  · las listas (PERSONAS_LAZO no cambia; PERSONAS_LAZO_VECINOS y LAZOS_TODOS son nuevas; los acompañantes y los aliados de la noche, iguales);
//  · que el lazo se guarda: historiaNueva, sanearHistoria (partidas viejas con seis claves, basura, ida y vuelta), estadoHistoria;
//  · que los efectos `lazo:<vecino>:<n>` de las escenas de verdad se aplican una sola vez por escena (y los de los seis, como antes);
//  · la guía («con quién tenés lazo»), la tarjeta de decisión, el final, la charla de después y los encargos de Nicanor;
//  · la optativa de Sofía (el registro, el disparador, el tablón, que nunca traba) y el cuaderno de lo raro.
// Las pruebas de texto corren contra una COPIA de src/ con un historia-texto-lazos.js de prueba (frases conocidas): así no dependen de lo que
// escriba B. Aparte, el modo «real» mira la forma de los archivos de B (si es el hueco, no encuentra nada y no falla). Al final, mutaciones:
// cada una en un proceso aparte, sobre otra copia, con un nombre de carpeta distinto (el caché de ESM no mide dos veces lo mismo).
import { readFileSync, writeFileSync, rmSync, cpSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const HIJO = !!process.env.LAZOSA_SRC;
const SRC = process.env.LAZOSA_SRC || join(raiz, 'src');
const leer = (f) => readFileSync(join(raiz, f), 'utf8');
const leerSrc = (f) => readFileSync(join(SRC, f), 'utf8');
const imp = (f) => import(pathToFileURL(join(SRC, f)).href);
let n = 0, fallas = 0;
const ok = (c, t) => { n++; if (!c) { fallas++; if (!process.env.LAZOSA_CALLADO) console.log('FALLA ' + t); } };
const igual = (a, b, t) => ok(JSON.stringify(a) === JSON.stringify(b), `${t} (${JSON.stringify(a)} ≠ ${JSON.stringify(b)})`);

const SEIS = ['ramon', 'ema', 'ercilia', 'guarda', 'fermin', 'graciela'];
const SIETE = ['rosa', 'tobias', 'tito', 'belisario', 'herminia', 'nicanor', 'sofia'];

// El texto de prueba (misma API que el de B)
const TEXTO_DE_PRUEBA = `export const VECINOS_LAZO = ['rosa', 'tobias', 'tito', 'belisario', 'herminia', 'nicanor', 'sofia'];
export const TEXTO_LAZOS = {
  guia: {
    tito: { nombre: 'Tito', rol: 'el carpintero', frases: { conocido: 'FRASE-TITO-CONOCIDO', 'de confianza': 'FRASE-TITO-CONFIANZA', tirante: 'FRASE-TITO-TIRANTE' } },
    rosa: { nombre: 'Rosa', rol: 'la panadera', frases: { 'de la casa': 'FRASE-ROSA-CASA' } },
  },
  final: {
    rosa: [{ id: 'final-rosa', min: 3, texto: 'FINAL-ROSA' }],
    tito: [{ id: 'final-tito', min: 3, texto: 'FINAL-TITO-CASA' }, { id: 'final-tito-tirante', max: -1, texto: 'FINAL-TITO-TIRANTE' }],
    sofia: [{ id: 'final-sofia', min: 2, texto: 'FINAL-SOFIA' }],
    nicanor: [{ id: 'final-nicanor', min: 3, texto: 'FINAL-NICANOR' }],
  },
  charlas: {
    tito: [
      { id: 'tito-lazo-bien', cap: 5, texto: 'CHARLA-TITO-BIEN', cuando: { lazo: { min: 2 } } },
      { id: 'tito-lazo-tirante', cap: 5, texto: 'CHARLA-TITO-TIRANTE', cuando: { lazo: { max: -1 } } },
      { id: 'tito-lazo-nueve', cap: 9, texto: 'CHARLA-TITO-NUEVE', cuando: { lazo: { min: 2 } } },
    ],
    rosa: [{ id: 'rosa-lazo-bien', cap: 3, texto: 'CHARLA-ROSA-BIEN', cuando: { lazo: { min: 2 } } }],
    sofia: [
      { id: 'sofia-lazo-bien', cap: 7, texto: 'CHARLA-SOFIA-BIEN', cuando: { lazo: { min: 2 } } },
      { id: 'sofia-despues', cap: 7, texto: 'CHARLA-SOFIA-DESPUES', cuando: { escena: 'foto-valle' } },
    ],
    ramon: [{ id: 'ramon-lazo-intruso', cap: 1, texto: 'CHARLA-INTRUSA', cuando: { lazo: { min: -9 } } }],
    nicanor: [
      { id: 'nicanor-sin-cuando', cap: 1, texto: 'CHARLA-SIN-CUANDO' },
      { id: 'nicanor-vacio', cap: 1, texto: 'CHARLA-VACIA', cuando: { lazo: {} } },
      { id: 7, cap: 1, texto: 'CHARLA-SIN-ID', cuando: { lazo: { min: 0 } } },
    ],
  },
  tablon: { 'foto-valle': { caps: [7, 8], quien: 'sofia', titulo: 'La foto del valle', ofrecida: 'TABLON-OFRECIDA', hecha: 'TABLON-HECHA' } },
  raro: { 'foto-del-valle': { titulo: 'La foto del valle', texto: 'RARO-FOTO-DEL-VALLE', cap: 7, donde: 'estudio de fotos' } },
};
export function lazoCumple(c, v) {
  const x = Number(v) || 0, w = c && typeof c === 'object' ? c : {};
  return (w.min === undefined || w.min === null || x >= Number(w.min)) && (w.max === undefined || w.max === null || x <= Number(w.max));
}
export function finalDeLazos(lazoDe) {
  const r = [];
  for (const q of VECINOS_LAZO) for (const l of Array.isArray(TEXTO_LAZOS.final[q]) ? TEXTO_LAZOS.final[q] : []) if (l && typeof l.texto === 'string' && lazoCumple(l, lazoDe(q))) r.push(l.texto);
  return r;
}
`;

const H = await imp('historia.js');
const D = await imp('historia-disparadores.js');
const DO = await imp('historia-disparadores-optativas.js');
const O = await imp('historia-optativas.js');
const EF = await imp('historia-escenas-efectos.js');
const U = await imp('historia-escenas-util.js');
const FIN = await imp('historia-final.js');
const N = await imp('historia-noche.js');
const EN = await imp('escenas.js');
const TL = await imp('historia-texto-lazos.js');
const EL = await imp('historia-escenas-lazos.js');
const A1 = await imp('historia-escenas-acto1.js');
const A2 = await imp('historia-escenas-acto2.js');
const A3 = await imp('historia-escenas-acto3.js');
const EO = await imp('historia-escenas-optativas.js');

const IDX = Object.fromEntries(H.CAPITULOS.map((c, i) => [c.id, i]));
const progresoBase = () => ({ dia: 6, horas: 10, entradas: {}, cosas: {}, materiales: {}, acopio: {}, peces: {}, talados: [], renovales: [], encargos: {}, obras: [], huerta: {}, visitas: { cuenta: 0 }, comercio: { entregas: 0 }, aldea: { pobladores: [] }, cocina: { hechas: {} }, economia: { pesos: 1000 }, eventosValle: { hechos: {} }, concursos: { cintas: [] }, historia: H.historiaNueva() });
const armar = (capId, { dec = {}, dia = 6, horas = 10, pobladores = [], lazos = {} } = {}) => {
  const p = progresoBase(); p.dia = dia; p.horas = horas; p.aldea.pobladores = pobladores.map((clave) => ({ clave }));
  const h = p.historia; H.empezarHistoria(h, 1); h.capitulo = IDX[capId]; h.fase = 'jugando'; h.base = { dia }; h.cerrados = { ramal: dia - 3, cuaderno: dia - 1, nevada: dia - 1 };
  Object.assign(h.decisiones, dec);
  for (const [k, v] of Object.entries(lazos)) H.cambiarLazo(h, k, v);
  return { p, h };
};
const E = (p, extra = {}) => H.estadoHistoria(p, { estacionNatural: 'verano', estacion: 'verano', lugares: {}, ...extra });
const vista = (h, id, dia = 6) => EN.marcarVista(h, id, dia);
const hLimpia = () => H.historiaNueva();
const todasLasEscenas = { ...A1.ESCENAS_ACTO1, ...A2.ESCENAS_ACTO2, ...A3.ESCENAS_ACTO3, ...EO.ESCENAS_OPTATIVAS, ...EL.ESCENAS_LAZOS };
const nombresLazo = new Set();
for (const e of Object.values(todasLasEscenas)) for (const ef of U.efectosDe(e)) if (ef.startsWith('lazo:')) nombresLazo.add(ef);
const reg = (h, nombres, dia = 5) => {
  const r = { efectos: {}, conds: {}, registrarEfecto(k, f) { this.efectos[k] = f; }, registrarCondicion(k, f) { this.conds[k] = f; } };
  const ctx = { historia: () => h, dia: () => dia, estado: () => null };
  EF.registrarEfectosHistoria(r, ctx);
  EF.registrarEfectosActo1(r, ctx, nombres);
  return r;
};

if (!HIJO) {
  // ================================================================ modo «real»: la forma de lo que escribe B (con el hueco no encuentra nada y no falla)
  const T1 = (await imp('historia-texto-acto1.js')).TEXTO_ACTO1, T2 = (await imp('historia-texto-acto2.js')).TEXTO_ACTO2, T3 = (await imp('historia-texto-acto3.js')).TEXTO_ACTO3, TO = (await imp('historia-texto-optativas.js')).TEXTO_OPTATIVAS;
  const T = TL.TEXTO_LAZOS;
  ok(T && typeof T === 'object' && ['guia', 'final', 'charlas', 'tablon', 'raro'].every((k) => typeof T[k] === 'object' && T[k]), 'TEXTO_LAZOS tiene guia, final, charlas, tablon y raro');
  ok(typeof TL.finalDeLazos === 'function' && typeof TL.lazoCumple === 'function' && Array.isArray(TL.VECINOS_LAZO), 'historia-texto-lazos.js exporta finalDeLazos, lazoCumple y VECINOS_LAZO');
  igual([...TL.VECINOS_LAZO].sort(), [...SIETE].sort(), 'VECINOS_LAZO son los siete');
  for (const k of ['guia', 'final', 'charlas']) for (const q of Object.keys(T[k])) ok(SIETE.includes(q), `${k}: «${q}» es uno de los siete (los seis de siempre no se tocan)`);
  const ids = new Set();
  for (const X of [T1, T2, T3, TO]) for (const l of Object.values(X.charla || {})) for (const x of l) ids.add(x.id);
  for (const [q, lista] of Object.entries(T.charlas)) for (const l of lista) {
    ok(typeof l.id === 'string' && /^[a-z0-9][a-z0-9_-]*$/.test(l.id), `charla ${q}/${l.id}: id sin ñ ni tildes`);
    ok(!ids.has(l.id), `charla ${l.id}: no repite el id de otra`); ids.add(l.id);
    ok(Number.isInteger(l.cap) && l.cap >= 1 && l.cap <= 13 && typeof l.texto === 'string' && l.texto.length > 10, `charla ${l.id}: capítulo y texto`);
    const w = l.cuando || {};
    ok((w.lazo && (Number.isFinite(w.lazo.min) || Number.isFinite(w.lazo.max))) || typeof w.escena === 'string', `charla ${l.id}: condición de lazo o de escena`);
    if (typeof w.escena === 'string') ok(Object.hasOwn(todasLasEscenas, w.escena), `charla ${l.id}: la escena «${w.escena}» existe`);
    ok(!/\d\s*(puntos?|de lazo)|lazo\s*[:=]?\s*[-+]?\d/i.test(l.texto), `charla ${l.id}: sin números de lazo`);
  }
  for (const [q, lista] of Object.entries(T.final)) for (const l of lista) {
    ok(typeof l.id === 'string' && typeof l.texto === 'string' && l.texto.length > 10 && (Number.isFinite(l.min) || Number.isFinite(l.max)), `final ${q}/${l.id}: id, texto y tramo`);
    ok(!(Number.isFinite(l.min) && l.min < 1) || Number.isFinite(l.max), `final ${q}/${l.id}: un final «bueno» pide lazo bueno`);
  }
  for (const [q, g] of Object.entries(T.guia)) for (const p of Object.keys(g.frases || {})) ok(['frío', 'tirante', 'conocido', 'de confianza', 'de la casa'].includes(p), `guía ${q}: «${p}» es una palabra de lazo`);
  // el final con todos en la casa trae una línea por vecino que tiene (y con todos en cero, ninguna)
  const hAlto = H.historiaNueva(); for (const k of SIETE) H.cambiarLazo(hAlto, k, 3);
  const conTodos = FIN.tarjetaFinal(hAlto).texto, sinNadie = FIN.tarjetaFinal(H.historiaNueva()).texto;
  const delFinal = TL.finalDeLazos((q) => H.lazoDe(hAlto, q));
  ok(delFinal.every((t) => conTodos.includes(t)), 'el final con lazo de la casa trae todas las líneas de B');
  igual(TL.finalDeLazos(() => 0).filter((t) => sinNadie.includes(t)), [], 'con lazos en cero no sale ninguna línea de vecino en el final');
  // el juego armado tiene que parsear (una vez un comentario a mitad de línea se comió el cierre de una llamada y la página no cargaba)
  {
    const html = readFileSync(join(raiz, 'index.html'), 'utf8');
    const { Script } = await import('node:vm');
    const bloques = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
    let bien = bloques.length > 0;
    for (const b of bloques) { try { new Script(b); } catch (e) { bien = false; console.log('  no parsea:', e.message); } }
    ok(bien, 'el index.html armado parsea (todos sus bloques de script)');
  }
  // la escena de Sofía
  const esc = EL.ESCENAS_LAZOS;
  ok(Object.hasOwn(esc, 'foto-valle') && esc['foto-valle'].id === 'foto-valle', 'está la escena foto-valle');
  const efs = U.efectosDe(esc['foto-valle']);
  ok(efs.every((e) => U.parsearEfecto(e) || /^(raro|objeto|mundo|dar|quitar|optativa|entrega):/.test(e)), 'los efectos de la escena de Sofía se entienden');
  const lz = efs.filter((e) => e.startsWith('lazo:'));
  ok(lz.length >= 1 && lz.every((e) => e.startsWith('lazo:sofia:')) && lz.every((e) => [1, 2, 3].includes(Number(e.split(':')[2]))), 'la escena de Sofía sólo suma lazo a Sofía');
  const pasos = esc['foto-valle'].pasos;
  const conLazoFijo = pasos.filter((p) => p.tipo === 'efecto' && String(p.nombre).startsWith('lazo:'));
  const eleccionesConLazo = pasos.filter((p) => p.tipo === 'eleccion' && (p.opciones || []).some((o) => String(o.efecto || '').startsWith('lazo:')));
  ok(conLazoFijo.length + eleccionesConLazo.length >= 1 && !(conLazoFijo.length && eleccionesConLazo.length), 'el lazo de Sofía lo da una sola vez por camino (o fijo o por la elección, no los dos)');
  for (const e of eleccionesConLazo) ok(e.opciones.every((o) => String(o.efecto || '').startsWith('lazo:') || o.sabor), 'cada opción que mueve el lazo suma una sola cosa');
  ok(esc['foto-valle'].pasos.every((p) => p.tipo !== 'efecto' || !String(p.nombre).startsWith('dar:')) && !efs.some((e) => /^(dar|quitar):/.test(e)), 'sin premios de objetos ni de plata');
  ok(Object.hasOwn(T.tablon, 'foto-valle') && T.tablon['foto-valle'].quien === 'sofia' && typeof T.tablon['foto-valle'].titulo === 'string', 'está el tablón de foto-valle');
  ok(Object.hasOwn(T.raro, 'foto-del-valle') && typeof T.raro['foto-del-valle'].texto === 'string', 'está el indicio foto-del-valle (la escena lo anota)');
  ok(Object.hasOwn(H.RAROS, 'foto-del-valle'), 'el cuaderno de lo raro conoce foto-del-valle');
  ok(JSON.stringify(EL.EFECTOS_LAZOS) === JSON.stringify([...new Set(Object.values(esc).flatMap((e) => U.efectosDe(e)))].sort()), 'EFECTOS_LAZOS son los de las escenas');
}

if (HIJO) {
  // ================================================================ 1. las listas
  igual(H.PERSONAS_LAZO, SEIS, 'PERSONAS_LAZO sigue con los seis de siempre');
  igual(H.PERSONAS_LAZO_VECINOS, SIETE, 'PERSONAS_LAZO_VECINOS son los siete');
  igual(H.LAZOS_TODOS, [...SEIS, ...SIETE], 'LAZOS_TODOS: los seis y los siete');
  igual(H.ACOMPANANTES, [...SEIS, 'tobias'], 'los acompañantes no cambian (los siete no van con vos a pie)');
  igual(H.VECINOS_HISTORIA, ['ramon', 'nicanor', 'ema', 'ercilia', 'fermin'], 'VECINOS_HISTORIA no cambia');
  const al = N.aliadosDe({ lazos: Object.fromEntries(H.LAZOS_TODOS.map((k) => [k, 3])), decisiones: {}, perro: false });
  igual(Object.keys(al).sort(), ['fermin', 'josefina', 'perro', 'ramon'], 'los aliados de la noche son los de siempre (ningún vecino nuevo defiende)');
  igual(U.LAZOS_SECUNDARIOS, ['rosa', 'herminia', 'nicanor', 'tito', 'tobias', 'belisario', 'sofia'], 'las escenas aceptan los siete');
  for (const k of SIETE) ok(U.parsearEfecto(`lazo:${k}:1`)?.quien === k && U.parsearEfecto(`lazo:${k}:-2`)?.n === -2, `parsearEfecto entiende lazo:${k}`);
  ok(U.parsearEfecto('lazo:zorzal:1') === null && U.parsearEfecto('lazo:tito:0') === null && U.parsearEfecto('lazo:tito:9') === null, 'y rechaza lo que no es');

  // ================================================================ 2. lazoDe / cambiarLazo
  for (const k of SIETE) {
    const h = hLimpia();
    ok(H.lazoDe(h, k) === 0, `${k}: arranca en cero`);
    ok(H.cambiarLazo(h, k, 1) === 1 && H.lazoDe(h, k) === 1, `${k}: sube`);
    ok(H.cambiarLazo(h, k, 9) === 2 && H.lazoDe(h, k) === 3, `${k}: topa en +3`);
    ok(H.cambiarLazo(h, k, -9) === -5 && H.lazoDe(h, k) === -2, `${k}: topa en −2`);
    ok(H.cambiarLazo(h, k, 'x') === 0, `${k}: sólo números`);
    ok(SEIS.every((s) => H.lazoDe(h, s) === 0), `${k}: no mueve a ninguno de los seis`);
  }
  { const h = hLimpia(); ok(H.cambiarLazo(h, 'zorzal', 1) === 0 && H.cambiarLazo(h, '__proto__', 1) === 0 && H.lazoDe(h, '__proto__') === 0 && !Object.hasOwn(h.lazos, 'zorzal'), 'un nombre inventado no se guarda'); }
  { const h = hLimpia(); delete h.lazos.tito; ok(H.cambiarLazo(h, 'tito', 2) === 2 && H.lazoDe(h, 'tito') === 2, 'si a la partida le faltaba la clave, se crea'); h.lazos = null; ok(H.cambiarLazo(h, 'rosa', 1) === 1 && H.lazoDe(h, 'rosa') === 1, 'y si lazos no era un objeto, se rehace'); }

  // ================================================================ 3. se guardan (con sanearHistoria)
  { const h = hLimpia(); igual(Object.keys(h.lazos), [...SEIS, ...SIETE], 'una historia nueva trae los trece lazos'); ok(Object.values(h.lazos).every((v) => v === 0), 'todos en cero'); }
  {
    // una partida de la 4.18.1: sólo seis claves
    const vieja = { activa: true, capitulo: 3, fase: 'jugando', empezada: 2, version: 2, lazos: { ramon: 2, ema: -1, ercilia: 3, guarda: 1, fermin: 0, graciela: 2 } };
    const s = H.sanearHistoria(vieja);
    igual(Object.keys(s.lazos), [...SEIS, ...SIETE], 'una partida vieja con seis claves carga con las trece');
    igual(SEIS.map((k) => s.lazos[k]), [2, -1, 3, 1, 0, 2], 'y los seis valores quedan como estaban');
    ok(SIETE.every((k) => s.lazos[k] === 0), 'los siete empiezan en cero (no se inventa nada)');
    igual(H.sanearHistoria(JSON.parse(JSON.stringify(s))).lazos, s.lazos, 'ida y vuelta por JSON: igual');
    const sinLazos = H.sanearHistoria({ activa: true, capitulo: 1, fase: 'jugando', empezada: 1, version: 2 });
    ok(Object.keys(sinLazos.lazos).length === 13 && Object.values(sinLazos.lazos).every((v) => v === 0), 'una partida sin lazos carga con los trece en cero');
    const rara = H.sanearHistoria({ version: 2, lazos: { tito: 9, rosa: -9, sofia: 1.9, nicanor: 'x', herminia: null, belisario: '2', tobias: [], zorzal: 3, __proto__: 1, ramon: 7 } });
    igual([rara.lazos.tito, rara.lazos.rosa, rara.lazos.sofia, rara.lazos.nicanor, rara.lazos.herminia, rara.lazos.belisario, rara.lazos.tobias, rara.lazos.ramon], [3, -2, 1, 0, 0, 2, 0, 3], 'los valores raros se acotan a −2…+3 y se hacen enteros');
    ok(!Object.hasOwn(rara.lazos, 'zorzal') && Object.keys(rara.lazos).length === 13, 'una clave inventada no se guarda');
    const guardada = H.sanearHistoria({ ...vieja, lazos: { ...vieja.lazos, tito: 2, sofia: 3, nicanor: -1 } });
    igual([guardada.lazos.tito, guardada.lazos.sofia, guardada.lazos.nicanor], [2, 3, -1], 'los siete se guardan y se vuelven a leer');
    ok(H.sanearHistoria(null).lazos.tito === 0 && H.sanearHistoria('x').lazos.sofia === 0, 'una historia que no es objeto: historia nueva');
    ok(/sanearHistoria\(p\.historia\)/.test(leerSrc('guardado.js')), 'el guardado pasa la historia por sanearHistoria');
  }
  { const { p, h } = armar('rueda'); H.cambiarLazo(h, 'tito', 2); H.cambiarLazo(h, 'sofia', -1); const s = E(p); ok(s.lazos.tito === 2 && s.lazos.sofia === -1 && s.lazos.rosa === 0 && Object.keys(s.lazos).length === 13, 'estadoHistoria trae los trece lazos (las escenas y los disparadores los leen)'); }

  // ================================================================ 4. los efectos de las escenas de verdad
  {
    const conLazoVecino = [...nombresLazo].filter((e) => SIETE.includes(e.split(':')[1]));
    ok(conLazoVecino.length >= 12, `hay al menos 12 efectos de lazo distintos para los siete en las escenas (${conLazoVecino.length})`);
    igual([...new Set(conLazoVecino.map((e) => e.split(':')[1]))].sort(), [...SIETE].sort(), 'las escenas mueven a los siete (Sofía con la nueva)');
    const todos = [...new Set([...A1.EFECTOS_ACTO1, ...A2.EFECTOS_ACTO2, ...A3.EFECTOS_ACTO3, ...EO.EFECTOS_OPTATIVAS, ...EL.EFECTOS_LAZOS])];
    for (const e of nombresLazo) ok(todos.includes(e), `${e}: es de los efectos que main.js registra`);
    for (const e of nombresLazo) {
      const p = U.parsearEfecto(e);
      ok(!!p, `${e}: se entiende`);
      if (!p) continue;
      const h = hLimpia(); const r = reg(h, [e]);
      ok(typeof r.efectos[e] === 'function', `${e}: está registrado`);
      r.efectos[e]({}, { escena: 'escena-a' });
      const tope = (v) => Math.max(-2, Math.min(3, v));
      ok(H.lazoDe(h, p.quien) === tope(p.n), `${e}: mueve el lazo de ${p.quien}`);
      r.efectos[e]({}, { escena: 'escena-a' });
      ok(H.lazoDe(h, p.quien) === tope(p.n), `${e}: la segunda vez, en la misma escena, no cuenta`);
      igual(H.LAZOS_TODOS.filter((k) => k !== p.quien && H.lazoDe(h, k) !== 0), [], `${e}: no mueve a nadie más`);
    }
    // el mismo efecto en otra escena sí suma (cada escena, una vez); y el efecto genérico con argumentos
    const h = hLimpia(); const r = reg(h, ['lazo:tito:1']);
    r.efectos['lazo:tito:1']({}, { escena: 'una' }); r.efectos['lazo:tito:1']({}, { escena: 'otra' }); r.efectos['lazo:tito:1']({}, { escena: 'una' });
    ok(H.lazoDe(h, 'tito') === 2, 'el mismo lazo en dos escenas distintas suma dos veces; repetir una, no');
    r.efectos.lazo({ quien: 'sofia', n: 2 }, { escena: 'x' }); r.efectos.lazo({ quien: 'sofia', n: 2 }, { escena: 'x' }); r.efectos.lazo({ quien: 'zorzal', n: 2 }, { escena: 'x' });
    ok(H.lazoDe(h, 'sofia') === 2 && !Object.hasOwn(h.lazos, 'zorzal'), 'el efecto con argumentos también se aplica una vez y no inventa gente');
    // los seis, como antes
    const h6 = hLimpia(); const r6 = reg(h6, ['lazo:ramon:1', 'lazo:ema:-2']);
    r6.efectos['lazo:ramon:1']({}, { escena: 'e1' }); r6.efectos['lazo:ramon:1']({}, { escena: 'e1' }); r6.efectos['lazo:ema:-2']({}, { escena: 'e2' });
    ok(h6.lazos.ramon === 1 && h6.lazos.ema === -2, 'los de los seis, igual que antes');
    // las condiciones de escena leen los siete
    const hc = hLimpia(); H.cambiarLazo(hc, 'tobias', 2); const rc = reg(hc, []);
    ok(rc.conds.lazo({ args: { quien: 'tobias', min: 2 } }) === true && rc.conds.lazo({ args: { quien: 'tobias', min: 3 } }) === false && rc.conds.lazo({ args: { quien: 'tobias', max: 1 } }) === false, 'la condición `lazo` lee a Tobías');
    ok(rc.conds.lazo({ args: { quien: 'sofia', max: -1 } }) === false && rc.conds.lazo({ args: { quien: 'sofia', max: 0 } }) === true, 'y a Sofía');
  }

  // ================================================================ 5. la guía («con quién tenés lazo»)
  {
    const h = hLimpia();
    igual(H.lazosEnPalabras(h), [], 'una historia nueva: ningún lazo en la guía');
    H.cambiarLazo(h, 'tito', 1); H.cambiarLazo(h, 'sofia', -1); H.cambiarLazo(h, 'herminia', -2); H.cambiarLazo(h, 'rosa', 3);
    const g = H.lazosEnPalabras(h), por = (k) => g.find((x) => x.quien === k);
    ok(por('tito')?.nombre === 'Tito' && por('tito')?.palabra === 'de confianza', 'Tito aparece con su palabra');
    ok(por('sofia')?.nombre === 'Sofía' && por('sofia')?.palabra === 'tirante', 'Sofía aparece como tirante');
    ok(por('herminia')?.palabra === 'frío' && por('rosa')?.palabra === 'de la casa', 'Herminia fría y Rosa de la casa');
    ok(por('nicanor') === undefined && por('belisario') === undefined && por('tobias') === undefined, 'los que todavía no conocés no salen');
    ok(por('tito')?.oficio === 'el carpintero' && por('tito')?.frase === 'FRASE-TITO-CONFIANZA', 'el oficio y la frase de B bajo la palabra');
    ok(por('rosa')?.oficio === 'la panadera' && por('rosa')?.frase === 'FRASE-ROSA-CASA', 'lo mismo con Rosa');
    ok(por('sofia')?.oficio === '' && por('sofia')?.frase === '', 'sin texto de B para ese lazo, no se inventa nada');
    for (const x of g) ok(['nombre', 'palabra', 'oficio', 'frase'].every((k) => typeof x[k] === 'string' && !/\d/.test(x[k])), `${x.quien}: la guía no muestra números`);
    const orden = g.map((x) => x.quien); igual(orden, H.LAZOS_TODOS.filter((k) => orden.includes(k)), 'siempre en el mismo orden');
    // un vecino se conoce también por haber hablado o por una marca a su nombre
    const hn = hLimpia(); H.anotarCharla(hn, 'nicanor'); ok(H.lazosEnPalabras(hn).some((x) => x.quien === 'nicanor' && x.palabra === 'conocido'), 'Nicanor, con quien ya hablaste, sale como conocido');
    const hm = hLimpia(); H.marcarTema(hm, 'rosa', 'frasco', 3); H.marcarEntrega(hm, 'tito', 'tablas-coihue', 3);
    igual(H.lazosEnPalabras(hm).map((x) => x.quien), ['rosa', 'tito'], 'y los que tienen una marca a su nombre (un tema, una entrega)');
    ok(H.lazosEnPalabras(hm).every((x) => x.palabra === 'conocido'), 'con lazo en cero, «conocido»');
    const hs = hLimpia(); hs.lazos.graciela = 2; hs.hablados.ramon = true; igual(H.lazosEnPalabras(hs).map((x) => `${x.quien}:${x.palabra}`), ['ramon:conocido', 'graciela:de confianza'], 'los seis, como antes');
    ok(H.lazosEnPalabras(hs).every((x) => x.oficio === '' && x.frase === ''), 'y sin oficio ni frase (no se tocan)');
    const ui = leerSrc('historia-ui.js');
    ok(/l\.oficio \? `, \$\{escP\(l\.oficio\)\}`/.test(ui) && /<small>\$\{escP\(l\.frase\)\}<\/small>/.test(ui) && /escP\(l\.palabra\)/.test(ui), 'la guía dibuja nombre, oficio, palabra y frase');
  }

  // ================================================================ 6. la tarjeta de decisión
  {
    ok(H.avisoLazosDe({ lazos: { tito: 2 } }) === 'Tito te va a tener más confianza', 'la tarjeta nombra a Tito (más confianza)');
    ok(H.avisoLazosDe({ lazos: { tobias: -1 } }) === 'Tobías se te va a enfriar', 'y a Tobías (se enfría)');
    ok(H.avisoLazosDe({ lazos: { ema: -2, ramon: 1 } }) === '' && H.avisoLazosDe({}) === '' && H.avisoLazosDe(null) === '', 'a los seis no los nombra (su detalle ya lo cuenta) y sin lazos, nada');
    ok(H.avisoLazosDe({ lazos: { rosa: 1, ema: 1, sofia: -2 } }) === 'Rosa te va a tener más confianza. Sofía se te va a enfriar', 'varios, en palabras');
    ok(!/\d/.test(H.avisoLazosDe({ lazos: { tito: 3, rosa: -2 } })), 'nunca números');
    const D0 = H.DEFINICION_DECISIONES;
    igual(D0.bolsa.opciones.find((o) => o.id === 'b').lazos, { ercilia: 2, rosa: 1 }, 'bolsa b: Ercilia como siempre y Rosa +1');
    igual(D0.coihue.opciones.find((o) => o.id === 'b').lazos, { ema: -2, tito: 2 }, 'coihue b: Josefina como siempre y Tito +2');
    igual(D0.coihue.opciones.find((o) => o.id === 'c').lazos, { ema: 1, tobias: 2 }, 'coihue c: Josefina como siempre y Tobías +2');
    igual(D0.coihue.opciones.find((o) => o.id === 'a').lazos, { ema: 1 }, 'coihue a no cambia');
    igual(D0.bolsa.opciones.find((o) => o.id === 'a').lazos, { ramon: 1 }, 'bolsa a no cambia');
    const h = hLimpia(); const o = H.tomarDecision(h, 'coihue', 'b');
    ok(o && h.lazos.ema === -2 && h.lazos.tito === 2 && h.lazos.tobias === 0, 'tomar la decisión mueve a Tito y a Josefina');
    ok(H.tomarDecision(h, 'coihue', 'c') === null && h.lazos.tobias === 0, 'una sola vez');
    const ui = leerSrc('historia-ui.js');
    ok(/const aviso = ok \? avisoLazosDe\(o\) : ''/.test(ui) && /import \{[^}]*avisoLazosDe/.test(ui), 'la tarjeta de decisión usa avisoLazosDe');
  }

  // ================================================================ 7. el final
  {
    const base = FIN.tarjetaFinal(hLimpia()).texto;
    ok(!base.some((t) => /^FINAL-/.test(t)), 'con los lazos en cero, el final no trae líneas de vecinos');
    const siempre = FIN.PIEZAS_FINAL.siempre;
    ok(base[base.length - 1] === siempre, 'la última pieza sigue siendo la última');
    const h = hLimpia(); h.lazos.rosa = 3; h.lazos.nicanor = 3; h.lazos.tito = 3; h.lazos.sofia = 2; h.lazos.graciela = 3; h.duendes.noche = 'perdida';
    const t = FIN.tarjetaFinal(h).texto;
    const i = (x) => t.indexOf(x);
    ok(i('FINAL-ROSA') >= 0 && i('FINAL-NICANOR') >= 0 && i('FINAL-TITO-CASA') >= 0 && i('FINAL-SOFIA') >= 0, 'con lazo de la casa salen las líneas de Rosa, Nicanor y Tito (y Sofía con 2)');
    ok(i(FIN.PIEZAS_FINAL.graciela) >= 0 && i(FIN.PIEZAS_FINAL.graciela) < i('FINAL-TITO-CASA') && i('FINAL-SOFIA') < i(FIN.PIEZAS_FINAL.nochePerdida) && i(FIN.PIEZAS_FINAL.nochePerdida) < i(siempre), 'van después de la de Graciela y antes de la noche perdida y de la última');
    igual(['FINAL-ROSA', 'FINAL-TITO-CASA', 'FINAL-NICANOR', 'FINAL-SOFIA'].map(i).every((x, k, a) => k === 0 || x > a[k - 1]), true, 'en un orden fijo (el de los siete)');
    h.lazos.rosa = 2; ok(!FIN.tarjetaFinal(h).texto.includes('FINAL-ROSA'), 'con lazo 2 (no de la casa) Rosa no sale');
    h.lazos.tito = -1; const tt = FIN.tarjetaFinal(h).texto; ok(tt.includes('FINAL-TITO-TIRANTE') && !tt.includes('FINAL-TITO-CASA'), 'y Tito tirante dice la línea tirante');
    h.lazos.tito = 0; ok(!FIN.tarjetaFinal(h).texto.some((x) => /FINAL-TITO/.test(x)), 'con lazo 0, ninguna');
    ok(FIN.tarjetaFinal(h).texto.filter((x) => x === FIN.PIEZAS_FINAL.graciela).length === 1, 'la de Graciela, una sola vez');
    ok(FIN.tarjetaFinal(hLimpia()).final === 'trato' && FIN.tarjetaFinal({ duendes: { trato: 'pelea' } }).final === 'pelea', 'los dos finales siguen igual');
  }

  // ================================================================ 8. la charla de después
  {
    const clave = { tito: 'carpintero', rosa: 'panadera', sofia: 'fotografa', ramon: 'ramon', nicanor: 'nicanor' };
    const linea = (h, p, k, extra) => O.lineaDeHistoria(h, E(p, extra), clave[k]);
    const decir = (h, p, k) => { const l = linea(h, p, k); if (l) O.oirLinea(h, l.id, 6); return l?.id ?? null; };
    {
      const { p, h } = armar('rueda', { dec: { coihue: 'b' }, lazos: { tito: 2 } });
      igual([decir(h, p, 'tito'), decir(h, p, 'tito'), decir(h, p, 'tito')], ['tito-c5-talado', 'tito-lazo-bien', null], 'Tito con lazo 2: primero lo que dice el acto, después la línea nueva, una vez cada una');
    }
    {
      const { p, h } = armar('rueda', { lazos: { tito: 1 } });
      ok(decir(h, p, 'tito') === null, 'con lazo 1 la línea nueva no sale');
      H.cambiarLazo(h, 'tito', 1); ok(decir(h, p, 'tito') === 'tito-lazo-bien', 'con lazo 2 sí');
    }
    {
      const { p, h } = armar('rueda', { lazos: { tito: -1 } });
      ok(decir(h, p, 'tito') === 'tito-lazo-tirante', 'con lazo < 0, la tirante');
      H.cambiarLazo(h, 'tito', 3); ok(decir(h, p, 'tito') === 'tito-lazo-bien', 'si el lazo mejora, deja de valer la tirante y vale la buena');
      const { p: p2, h: h2 } = armar('rueda', { lazos: { tito: 2 } }); ok(!/TIRANTE/.test(linea(h2, p2, 'tito')?.texto || ''), 'con lazo bueno, nunca la tirante');
    }
    {
      // una línea de lazo vale de su capítulo en adelante (no sólo en el capítulo en que se escribió)
      const { p, h } = armar('frios', { lazos: { tito: 2 } });
      const dichas = []; for (let k = 0; k < 10; k++) { const x = decir(h, p, 'tito'); if (x) dichas.push(x); }
      ok(dichas[0] === 'tito-c9-leña', 'más adelante, lo del acto primero');
      ok(dichas.includes('tito-lazo-nueve') && dichas.includes('tito-lazo-bien') && dichas.indexOf('tito-lazo-nueve') > 0, 'y después las de lazo, también la del capítulo 5');
    }
    {
      const { p, h } = armar('cosecha', { lazos: { sofia: 2 }, pobladores: ['fotografa'] });
      ok(decir(h, p, 'sofia') === 'sofia-lazo-bien' && decir(h, p, 'sofia') === null, 'Sofía con lazo 2 dice la suya, una vez, y la de después espera a la escena');
      vista(h, 'foto-valle'); ok(decir(h, p, 'sofia') === 'sofia-despues', 'con la escena vista, la de después');
    }
    {
      const { p, h } = armar('cosecha', { lazos: { ramon: 3, nicanor: 1 } });
      const deRamon = []; for (let k = 0; k < 12; k++) { const x = decir(h, p, 'ramon'); if (x) deRamon.push(x); }
      ok(deRamon.length > 0 && !deRamon.includes('ramon-lazo-intruso'), 'las charlas de lazo sólo son de los siete: la de Ramón no vale');
      const { p: p2, h: h2 } = armar('cosecha', { lazos: { nicanor: 3 } });
      const dichas = []; for (let k = 0; k < 6; k++) { const x = decir(h2, p2, 'nicanor'); if (x) dichas.push(x); }
      ok(!dichas.some((x) => /sin-cuando|vacio/.test(x)), 'una charla sin condición de lazo o con la condición vacía se ignora');
    }
    {
      const { p, h } = armar('rueda', { lazos: { rosa: 2 } });
      const dichas = []; for (let k = 0; k < 10; k++) { const x = decir(h, p, 'rosa'); if (x) dichas.push(x); }
      ok(dichas.includes('rosa-lazo-bien') && dichas[0] !== 'rosa-lazo-bien', 'Rosa con lazo 2: la suya, detrás de la del capítulo');
      const { p: pb, h: hb } = armar('rueda', { lazos: { rosa: 1 } }); const bajas = []; for (let k = 0; k < 10; k++) { const x = decir(hb, pb, 'rosa'); if (x) bajas.push(x); }
      ok(!bajas.includes('rosa-lazo-bien'), 'con lazo 1, no');
      const { p: pj, h: hj } = armar('rueda', { lazos: { rosa: 2 } }); hj.activa = false; ok(linea(hj, pj, 'rosa') === null, 'con la historia en pausa, nada');
    }
    ok(/lineaDeHistoria\(h, estado\(\), clave\)/.test(leerSrc('historia-ui.js')), 'la UI usa lineaDeHistoria al hablar');
  }

  // ================================================================ 9. los encargos con lazo
  {
    const lista = [{ id: 'e-pesca', quien: 'nicanor' }, { id: 'e-banco', quien: 'ramon' }, { id: 'x-tito', quien: 'tito' }, { id: 'x-zorzal', quien: 'zorzal' }];
    const { h, p } = armar('bolsa'); p.encargos = { 'e-banco': 'hecho' };
    O.revisarEncargos(h, p, lista, 6);
    p.encargos['e-pesca'] = 'hecho'; p.encargos['x-tito'] = 'hecho'; p.encargos['x-zorzal'] = 'hecho';
    const d = O.revisarEncargos(h, p, lista, 7);
    igual(d.map((x) => x.quien), ['nicanor', 'tito'], 'los encargos de Nicanor y de Tito suman +1 (y el de quien no tiene lazo, no)');
    ok(h.lazos.nicanor === 1 && h.lazos.tito === 1 && h.lazos.ramon === 0 && h.encargosLazo['x-zorzal'] === 0, 'cada uno al suyo');
    ok(O.revisarEncargos(h, p, lista, 8).length === 0 && h.lazos.nicanor === 1, 'una sola vez');
    const reales = [...(await imp('encargos.js')).ENCARGOS, ...(await imp('encargos-temporada.js')).ENCARGOS_TEMPORADA];
    ok(reales.filter((e) => e.quien === 'nicanor').length >= 5, 'Nicanor pide encargos de verdad en el juego (por eso el +1 de ahora)');
    // lo ya hecho antes de que existiera el lazo es la base: no da lazo retroactivo
    const v = armar('bolsa'); v.p.encargos = { 'e-pesca': 'hecho' }; igual(O.revisarEncargos(v.h, v.p, lista, 6), [], 'la primera vez, lo ya hecho es base y no da lazo');
    ok(v.h.lazos.nicanor === 0, 'Nicanor sigue en cero');
  }

  // ================================================================ 10. la optativa de Sofía
  {
    const o = O.OPTATIVA['foto-valle'];
    ok(!!o && o.quien === 'sofia' && o.desde === 'cosecha' && o.hasta === 'cuaderno', 'está en el registro: acto II, capítulos 7 y 8');
    ok(O.OPTATIVAS.length === 31 && new Set(O.IDS_OPTATIVAS_REGISTRO).size === 31, 'el registro tiene 31 sin repetir (29 y las dos de la 4.19.0)');
    ok(H.CAPITULOS[IDX[o.desde]].acto === H.CAPITULOS[IDX[o.hasta]].acto, 'no cruza de acto');
    ok(typeof o.ofrece === 'function' && typeof o.hecha === 'function', 'tiene ofrece y hecha');
    ok(O.textoOptativa('foto-valle') === 'La foto del valle' && O.pistaOptativa('foto-valle') === 'TABLON-OFRECIDA' && O.pistaOptativa('foto-valle', true) === 'TABLON-HECHA', 'el tablón sale de TEXTO_LAZOS');
    const est = (h, p, extra) => O.estadoOptativa(o, E(p, extra), h);
    { const { p, h } = armar('cosecha'); ok(est(h, p) === 'cerrada', 'sin Sofía en la aldea no se ofrece'); }
    { const { p, h } = armar('cosecha', { pobladores: ['fotografa'] }); ok(est(h, p) === 'ofrecida', 'con Sofía viviendo en la aldea, en el capítulo 7: ofrecida'); }
    { const { p, h } = armar('cuaderno', { pobladores: ['fotografa'] }); ok(est(h, p) === 'ofrecida', 'y en el 8'); }
    { const { p, h } = armar('perdido', { pobladores: ['fotografa'] }); ok(est(h, p) === 'cerrada', 'todavía no en el 6'); }
    { const { p, h } = armar('frios', { pobladores: ['fotografa'] }); ok(est(h, p) === 'cerrada', 'y ya no en el 9 (otro acto)'); }
    // dispara: auto en el estudio, o con la E sobre la fotógrafa
    ok(Object.hasOwn(D.DISPARADORES, 'foto-valle') && Object.hasOwn(D.DISPARADORES, 'foto-valle:hablar'), 'tiene sus dos disparadores');
    igual(D.DISPARADORES['foto-valle'].cap, ['cosecha', 'cuaderno'], 'valen en toda la ventana');
    ok(D.OPTATIVA_DE_DISPARADOR['foto-valle'] === 'foto-valle' && D.OPTATIVA_DE_DISPARADOR['foto-valle:hablar'] === 'foto-valle', 'y van con las optativas (después de los objetivos)');
    {
      const { p, h } = armar('cosecha', { pobladores: ['fotografa'], horas: 11 });
      const q = (extra, ctx = {}) => D.escenaPendiente(h, E(p, extra), ctx);
      ok(q({ lugares: { 'estudio-fotos': 5 } }) === 'foto-valle', 'cerca del estudio, de día: la escena');
      ok(q({ lugares: { 'estudio-fotos': 50 } }) === null, 'lejos del estudio, no');
      ok(q({}, { modo: 'hablar', clave: 'fotografa' }) === 'foto-valle', 'con la E sobre Sofía, la escena');
      ok(q({}, { modo: 'hablar', clave: 'carpintero' }) === null, 'con otro vecino, no');
      p.horas = 18; ok(q({ lugares: { 'estudio-fotos': 5 } }) === null && q({}, { modo: 'hablar', clave: 'fotografa' }) === null, 'de tarde, ya no (la escena espera la luz de las cinco)');
      p.horas = 11; vista(h, 'foto-valle'); ok(q({ lugares: { 'estudio-fotos': 5 } }) === null, 'una vez vista, no se repite');
    }
    { const { p, h } = armar('cosecha', { horas: 11 }); ok(D.escenaPendiente(h, E(p, { lugares: { 'estudio-fotos': 5 } }), {}) === null, 'sin Sofía en la aldea no se dispara'); }
    { const { p, h } = armar('perdido', { pobladores: ['fotografa'], horas: 11 }); ok(D.escenaPendiente(h, E(p, { lugares: { 'estudio-fotos': 5 } }), {}) !== 'foto-valle', 'ni antes del capítulo 7'); }
    // el lazo y el premio: lo da la escena; el registro sólo si la escena no lo trae
    {
      const { p, h } = armar('cosecha', { pobladores: ['fotografa'] });
      const sin = O.premioDe(o, E(p));
      ok(sin && sin.lazos.sofia === 1, 'si la escena no está vista, el registro da +1 de lazo a Sofía');
      vista(h, 'foto-valle');
      const con = O.premioDe(o, E(p));
      igual(con.lazos, {}, 'si la escena (que trae lazo:sofia) está vista, el registro no lo repite');
      const antes = H.lazoDe(h, 'sofia');
      const hechas = O.revisarOptativas(h, E(p), 6);
      ok(hechas.some((x) => x.id === 'foto-valle') && Object.hasOwn(h.optativas, 'foto-valle') && H.lazoDe(h, 'sofia') === antes, 'la optativa se anota una sola vez y el lazo no se duplica');
      ok(O.revisarOptativas(h, E(p), 7).every((x) => x.id !== 'foto-valle'), 'y no se anota dos veces');
      ok(O.estadoOptativa(o, E(p), h) === 'hecha', 'queda hecha');
    }
    { const { p, h } = armar('cosecha', { pobladores: ['fotografa'] }); const sinPremio = O.revisarOptativas(h, E(p), 6); ok(sinPremio.every((x) => x.id !== 'foto-valle'), 'sin la escena no se anota'); }
    { const { p, h } = armar('cosecha', { pobladores: ['fotografa'] }); H.cambiarLazo(h, 'sofia', 1); vista(h, 'foto-valle'); O.revisarOptativas(h, E(p), 6); ok(h.lazos.sofia === 1, 'el lazo que ya tenías no se pisa'); }
    // el tablón
    {
      const { p, h } = armar('cosecha', { pobladores: ['fotografa'] });
      const pan = O.optativasDelPanel(h, E(p)).find((x) => x.id === 'foto-valle');
      ok(pan && pan.estado === 'ofrecida' && pan.texto.startsWith('La foto del valle') && pan.pista === 'TABLON-OFRECIDA' && !pan.hecho, 'aparece en el tablón «De paso» como las demás');
      vista(h, 'foto-valle'); O.revisarOptativas(h, E(p), 6);
      ok(O.optativasDelPanel(h, E(p)).find((x) => x.id === 'foto-valle')?.hecho === true && O.optativasHechas(h).some((x) => x.id === 'foto-valle' && x.texto === 'TABLON-HECHA'), 'hecha, queda tildada y en la guía');
    }
    // nunca traba
    ok(H.CAPITULOS.every((c) => c.objetivos.every((x) => !String(x.id).includes('foto-valle'))) && H.CAPITULOS.every((c) => !JSON.stringify(c.momento || '').includes('foto-valle')), 'no es objetivo de ningún capítulo: nunca traba');
    { const { p, h } = armar('cosecha'); for (const x of H.capituloActual(h).objetivos) h.hechos[`cosecha:${x.id}`] = 6; ok(!H.revisarHistoria(h, E(p)).nuevos.some((x) => x.id === 'foto-valle'), 'completar el capítulo no pide la foto'); }
    // lo que cambia al verla: queda anotada a su nombre y la guía la conoce
    ok(typeof DO.EFECTOS_ESCENA_OPTATIVAS['foto-valle'] === 'function', 'tiene su efecto de escena');
    { const h = hLimpia(); DO.EFECTOS_ESCENA_OPTATIVAS['foto-valle'](h, 6, {}); igual(H.lazosEnPalabras(h).map((x) => x.quien), ['sofia'], 'ver la escena anota el tema a nombre de Sofía y la guía ya la conoce'); }
    // el indicio de lo raro
    ok(H.textoRaro('foto-del-valle') === 'RARO-FOTO-DEL-VALLE', 'el cuaderno de lo raro tiene el indicio de la foto del valle');
    { const h = hLimpia(); ok(H.anotarRaro(h, 'foto-del-valle', 7) && !H.anotarRaro(h, 'foto-del-valle', 8) && H.sanearHistoria({ ...h, version: 2 }).raro.some((x) => x.id === 'foto-del-valle'), 'se anota una vez y se guarda'); }
    // la escena de Sofía registrada en el motor y los efectos registrables
    ok(EL.IDS_LAZOS.includes('foto-valle') && Object.hasOwn(todasLasEscenas, 'foto-valle'), 'la escena está en las que main.js registra');
    for (const e of EL.EFECTOS_LAZOS) ok(U.parsearEfecto(e) || /^(raro|objeto|mundo|optativa|entrega):/.test(e), `efecto ${e}: se entiende`);
    // integración en el código
    const main = leerSrc('main.js');
    ok(/import \{ ESCENAS_LAZOS, EFECTOS_LAZOS \} from '\.\/historia-escenas-lazos\.js';/.test(main) && /\.\.\.Object\.values\(ESCENAS_LAZOS\)\]\)/.test(main) && /\.\.\.EFECTOS_OPTATIVAS, \.\.\.EFECTOS_LAZOS\]\)/.test(main), 'main.js registra las escenas y los efectos de Sofía');
    ok(/verificar-4-18-2-lazos-a\.mjs/.test(leer('package.json')), 'package.json corre esta prueba en verify:pasos');
  }
}

// ---------------------------------------------------------------- mutaciones (cada una en un proceso aparte, sobre una copia de src/)
const MUT = [
  // las listas y lazoDe / cambiarLazo
  ['historia.js', "return LAZOS_TODOS.includes(quien) ? Math.max(LAZO_MIN", "return PERSONAS_LAZO.includes(quien) ? Math.max(LAZO_MIN", 'lazoDe no lee a los siete'],
  ['historia.js', "if (!LAZOS_TODOS.includes(quien)) return 0;\n  if (!h.lazos", "if (!PERSONAS_LAZO.includes(quien)) return 0;\n  if (!h.lazos", 'cambiarLazo ignora a los siete'],
  ['historia.js', "export const ACOMPANANTES = [...PERSONAS_LAZO, 'tobias'];", "export const ACOMPANANTES = [...LAZOS_TODOS, 'tobias'];", 'los siete van de acompañantes'],
  ['historia.js', "export const lazosNuevos = () => Object.fromEntries(LAZOS_TODOS.map(", "export const lazosNuevos = () => Object.fromEntries(PERSONAS_LAZO.map(", 'la historia nueva no trae los siete'],
  // guardado
  ['historia.js', "for (const k of LAZOS_TODOS) h.lazos[k] = Math.max(LAZO_MIN, Math.min(LAZO_MAX, Math.trunc(aNum(obj(v.lazos)[k]) || 0)));", "for (const k of PERSONAS_LAZO) h.lazos[k] = Math.max(LAZO_MIN, Math.min(LAZO_MAX, Math.trunc(aNum(obj(v.lazos)[k]) || 0)));", 'el saneado no guarda los siete'],
  ['historia.js', "for (const k of LAZOS_TODOS) h.lazos[k] = Math.max(LAZO_MIN, Math.min(LAZO_MAX, Math.trunc(aNum(obj(v.lazos)[k]) || 0)));", "for (const k of LAZOS_TODOS) h.lazos[k] = Math.trunc(aNum(obj(v.lazos)[k]) || 0);", 'el saneado no acota los lazos'],
  ['historia.js', "lazos: Object.fromEntries(LAZOS_TODOS.map((k) => [k, lazoDe(hh, k)])),", "lazos: Object.fromEntries(PERSONAS_LAZO.map((k) => [k, lazoDe(hh, k)])),", 'las condiciones no ven a los siete'],
  // efectos
  ['historia-escenas-efectos.js', "if (h && LAZOS_TODOS.includes(a?.quien) && una(h, clave('lazo', c?.escena, a.quien, a.n)))", "if (h && ['ramon', 'ema', 'ercilia', 'guarda', 'fermin', 'graciela'].includes(a?.quien) && una(h, clave('lazo', c?.escena, a.quien, a.n)))", 'el efecto con argumentos ignora a los siete'],
  ['historia-escenas-efectos.js', "case 'lazo': if (LAZOS_TODOS.includes(p.quien) && una(h, clave(c))) cambiarLazo(h, p.quien, p.n); break;", "case 'lazo': if (['ramon', 'ema', 'ercilia', 'guarda', 'fermin', 'graciela'].includes(p.quien) && una(h, clave(c))) cambiarLazo(h, p.quien, p.n); break;", 'los efectos de escena ignoran a los siete'],
  ['historia-escenas-efectos.js', "case 'lazo': if (LAZOS_TODOS.includes(p.quien) && una(h, clave(c))) cambiarLazo(h, p.quien, p.n); break;", "case 'lazo': if (LAZOS_TODOS.includes(p.quien)) cambiarLazo(h, p.quien, p.n); break;", 'un lazo de escena cuenta cada vez que corre'],
  ['historia-escenas-util.js', "'belisario', 'sofia'];", "'belisario'];", 'las escenas no aceptan lazo:sofia'],
  // guía
  ['historia.js', "  for (const k of LAZOS_TODOS) {\n    const vecino", "  for (const k of PERSONAS_LAZO) {\n    const vecino", 'la guía no muestra a los siete'],
  ['historia.js', "oficio: typeof g.rol === 'string' ? g.rol : '',", "oficio: '',", 'la guía no trae el oficio'],
  ['historia.js', "|| (vecino && (conMarca('temas', k) || conMarca('entregados', k)))", "", 'la guía no conoce al vecino con quien pasó algo'],
  ['historia.js', "frase: typeof obj(g.frases)[palabra] === 'string' ? g.frases[palabra] : '' });", "frase: '' });", 'la guía no trae la frase'],
  // tarjeta de decisión
  ['historia.js', "    if (!PERSONAS_LAZO_VECINOS.includes(q)) continue;\n    const v = Math.trunc", "    const v = Math.trunc", 'la tarjeta nombra también a los seis'],
  ['historia.js', "lazos: { ercilia: 2, rosa: 1 }, requiere", "lazos: { ercilia: 2 }, requiere", 'la bolsa a Rosa no le suma'],
  ['historia.js', "lazos: { ema: -2, tito: 2 }, diario", "lazos: { ema: -2 }, diario", 'talar el coihue no le suma a Tito'],
  ['historia.js', "lazos: { ema: 1, tobias: 2 }, diario", "lazos: { ema: 1 }, diario", 'la pirca no le suma a Tobías'],
  ['historia-ui.js', "const aviso = ok ? avisoLazosDe(o) : '';", "const aviso = '';", 'la tarjeta no dice nada de los vecinos'],
  // final
  ['historia-final.js', "  texto.push(...piezasLazos(h, trato));   // 4.18.2 (4.19.0: con el final, para las líneas que sólo valen con uno)\n", "", 'el final no trae las líneas de los vecinos'],
  ['historia-final.js', "  texto.push(...piezasLazos(h, trato));   // 4.18.2 (4.19.0: con el final, para las líneas que sólo valen con uno)\n  if (h?.duendes?.noche === 'perdida') texto.push(PIEZAS_FINAL.nochePerdida);", "  if (h?.duendes?.noche === 'perdida') texto.push(PIEZAS_FINAL.nochePerdida);\n  texto.push(...piezasLazos(h, trato));", 'las líneas de vecinos van después de la noche perdida'],
  // charla de después
  ['historia-optativas.js', "|| l.deOptativa || l.deLazo) && cuandoOk", "|| l.deOptativa) && cuandoOk", 'la charla de lazo sólo vale en su capítulo'],
  ['historia-optativas.js', "&& v <= (Number.isFinite(w.lazo.max) ? w.lazo.max : 9);", ";", 'la charla tirante sale con buen lazo'],
  ['historia-optativas.js', "return v >= (Number.isFinite(w.lazo.min) ? w.lazo.min : -9) && v", "return v", 'la charla buena sale con lazo bajo'],
  ['historia-optativas.js', "((a.deLazo ? 1 : 0) - (b.deLazo ? 1 : 0)) || ", "", 'la charla de lazo le gana a la del acto'],
  ['historia-optativas.js', "if (!PERSONAS_LAZO_VECINOS.includes(quien)) continue;", "", 'las charlas de lazo valen también para los seis'],
  ['historia-optativas.js', "|| (!deEscena && !Number.isFinite(w.min) && !Number.isFinite(w.max))) continue;", ") continue;", 'una charla sin condición de lazo vale siempre'],
  // encargos
  ['historia-optativas.js', "if (LAZOS_TODOS.includes(q)) { cambiarLazo(h, q, 1);", "if (['ramon', 'ema', 'ercilia', 'guarda', 'fermin', 'graciela'].includes(q)) { cambiarLazo(h, q, 1);", 'los encargos de Nicanor no suman'],
  // optativa de Sofía
  ['historia-optativas.js', "&& !ya.lazos.has(q)) r.lazos[q] = n;", ") r.lazos[q] = n;", 'el lazo de la escena de Sofía se duplica'],
  ['historia-optativas.js', "desde: 'cosecha', hasta: 'cuaderno', quien: 'sofia',", "desde: 'cosecha', hasta: 'golpea', quien: 'sofia',", 'la optativa de Sofía cruza de acto'],
  ['historia-optativas.js', "{ const o = optativaDeLazo(OPTATIVA_SOFIA); if (o && !OPTATIVAS.some((x) => x.id === o.id)) OPTATIVAS.push(o); }", "", 'la optativa de Sofía no está en el registro'],
  ['historia-optativas.js', "&& pobladores.every((x) => s.pobladores.has(x)) && (!ofr.trato", "&& (!ofr.trato", 'se ofrece sin Sofía en la aldea'],
  ['historia-optativas.js', "const entradaDeTablon = (id) => obj(obj(TEXTO_OPTATIVAS.tablon)[id] || obj(TEXTO_LAZOS.tablon)[id]);", "const entradaDeTablon = (id) => obj(obj(TEXTO_OPTATIVAS.tablon)[id]);", 'el tablón no trae la entrada de Sofía'],
  ['historia-disparadores-optativas.js', "pobladores.every((x) => s.pobladores.has(x)) && (!ofr.trato", "(!ofr.trato", 'la escena sale sin Sofía en la aldea'],
  ['historia-disparadores-optativas.js', "  ...disparadoresDeLazo(OPTATIVA_SOFIA),\n", "", 'la escena de Sofía no tiene disparador'],
  ['historia-disparadores-optativas.js', "{ [OPTATIVA_SOFIA.escena]: T('sofia', OPTATIVA_SOFIA.id) }", "{}", 'ver la escena no deja marca a nombre de Sofía'],
  ['historia.js', ", ...Object.entries(TEXTO_LAZOS.raro || {})]", "]", 'el cuaderno de lo raro no conoce la foto del valle'],
  ['main.js', "...Object.values(ESCENAS_OPTATIVAS), ...Object.values(ESCENAS_LAZOS)]", "...Object.values(ESCENAS_OPTATIVAS)]", 'main.js no registra la escena de Sofía'],
];
let atrapadas = 0;
if (!HIJO) {
  const tmp = mkdtempSync(join(tmpdir(), 'lazos418-'));
  try {
    // la copia con el texto de prueba (el hijo sin mutar: tiene que pasar)
    const base = join(tmp, 'base', 'src');
    cpSync(join(raiz, 'src'), base, { recursive: true });
    writeFileSync(join(base, 'historia-texto-lazos.js'), TEXTO_DE_PRUEBA);
    const corre = (dir) => spawnSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, LAZOSA_SRC: dir, LAZOSA_CALLADO: '1' }, encoding: 'utf8', cwd: raiz });
    const conCopia = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, LAZOSA_SRC: base }, encoding: 'utf8', cwd: raiz });
    const lineasHijo = (conCopia.stdout || '').split('\n').filter((l) => l.startsWith('FALLA'));
    for (const l of lineasHijo) console.log(l);
    ok(conCopia.status === 0, 'con el texto de prueba, todas las comprobaciones del hijo pasan');
    const m = /HIJO (\d+)/.exec(conCopia.stdout || ''); if (m) n += Number(m[1]);
    for (const [arch, de, a, que] of MUT) {
      const orig = readFileSync(join(base, arch), 'utf8');
      if (!orig.includes(de)) { ok(false, `mutación inaplicable: ${que}`); continue; }
      const dir = join(tmp, `m${atrapadas}-${Math.random().toString(36).slice(2, 7)}`, 'src');
      cpSync(base, dir, { recursive: true });
      writeFileSync(join(dir, arch), orig.replace(de, () => a));
      const r = corre(dir);
      // (una mutación que rompe el código —sintaxis, un nombre que no existe— no vale: tiene que fallar una comprobación)
      if (/SyntaxError|ReferenceError|Cannot find|does not provide/.test(r.stderr || '')) { console.log(`MUTACIÓN ROTA: ${que}`); fallas++; }
      else if (r.status !== 0) atrapadas++; else console.log(`NO ATRAPADA: ${que}`);
      rmSync(dirname(dir), { recursive: true, force: true });
    }
  } finally { rmSync(tmp, { recursive: true, force: true }); }
  ok(atrapadas === MUT.length, `las mutaciones se atrapan (${atrapadas} de ${MUT.length})`);
}

if (HIJO) { if (!process.env.LAZOSA_CALLADO) console.log(`HIJO ${n}`); process.exit(fallas ? 1 : 0); }
console.log(fallas ? `FALLÓ: ${fallas} de ${n}` : `OK 4.18.2 (A) lazo de los vecinos · ${n} comprobaciones · ${atrapadas} mutaciones atrapadas`);
process.exit(fallas ? 1 : 0);
