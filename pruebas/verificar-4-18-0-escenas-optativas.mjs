// 4.18.0 (B): las escenas y los textos de las SUBTRAMAS OPTATIVAS de la Historia (src/historia-escenas-optativas.js y
// src/historia-texto-optativas.js). Sólo Node. Las escenas se validan con el director real (escenas.js), se corren por TODOS los caminos de
// elección y todas las variantes que miran (decisiones, el evento de la oveja con o sin perro), se saltan, y se revisan los textos (cabe en el
// cuadro, sin inglés, sin religión ni nada explícito, sin nombrar lo que no existe). Además: el tablón cubre las 28 optativas del guion, cada
// optativa con escena tiene su charla «de después» (en los actos o acá) y los pedidos para A están en CAMBIOS_4_18_0_B.md.
//
// MUTACIONES que miden de verdad: la suite entera (`todo`) recibe los MÓDULOS como parámetro. Las mutaciones de datos clonan lo exportado; las de
// CÓDIGO escriben una copia mutada de los dos archivos en una carpeta temporal (con sus dependencias) y la importan con `?v=<n>`, así cada
// mutante es un módulo nuevo (no el de la caché) y la suite corre sobre él. Cada mutación tiene que hacer fallar algo.
import { readFileSync, existsSync, mkdtempSync, writeFileSync, rmSync, copyFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { ESCENAS_ACTO1, DISPARO_ACTO1 } from '../src/historia-escenas-acto1.js';
import { ESCENAS_ACTO2, DISPARO_ACTO2 } from '../src/historia-escenas-acto2.js';
import { ESCENAS_ACTO3, DISPARO_ACTO3 } from '../src/historia-escenas-acto3.js';
import { TEXTO_ACTO1 } from '../src/historia-texto-acto1.js';
import { TEXTO_ACTO2 } from '../src/historia-texto-acto2.js';
import { TEXTO_ACTO3 } from '../src/historia-texto-acto3.js';
import { efectosDe, condicionesDe } from '../src/historia-escenas-util.js';
import { parsearEfectoActo3, CONDICIONES_ACTO3 } from '../src/historia-escenas-acto3-util.js';
import { crearDirector, validarEscena, PERSONAJES_BASE, POSES_ESCENA } from '../src/escenas.js';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => readFileSync(join(raiz, f), 'utf8');
let n = 0, fallas = 0;
const ok = (c, t) => { n++; if (!c) { fallas++; console.log('FALLA ' + t); } };

const ARCH_ESC = 'src/historia-escenas-optativas.js', ARCH_TEX = 'src/historia-texto-optativas.js';
const IDS_PEDIDOS = ['frasco-repisa', 'frasco-rosa', 'oveja-ramon', 'pan-fermin', 'vuelta-mirador', 'vuelta-faro', 'juntar-ovejas'];
// las claves nuevas que A tiene que implementar (documentadas en CAMBIOS_4_18_0_B.md y anotadas en el tablero)
const CLAVES_NUEVAS = ['objeto:frasco-masa-madre', 'entrega:frasco-masa-madre', 'mundo:pan-de-rosa', 'mundo:ovejas-juntas'];
const CLAVES_PEDIDAS = ['graciela', 'pareja'];
const NOMBRES_OK = new Set(['Administración', 'Aldea', 'Arroyo', 'Belisario', 'Don', 'Duendes', 'Elsa', 'Ercilia', 'Esquel', 'Estación', 'Eusebio', 'Fermín', 'Graciela', 'Herminia',
  'Josefina', 'Nicanor', 'Nélida', 'Pugh', 'Ramal', 'Ramón', 'Refugio', 'Rosa', 'Trevelin', 'Valle', 'Tito', 'Tobías', 'Sofía', 'Julia', 'Millán', 'Puesto', 'Alto', 'Chocolate',
  'Porfiada', 'Marta', 'Belisario', 'Lo', 'Por', 'Mansita', 'Mi', 'La']);
const PERSONAS_REALES = ['Belisario', 'Herminia', 'Rosa', 'Fermín', 'Nicanor', 'Ramón', 'Josefina', 'Ercilia', 'Elsa', 'Tito', 'Tobías'];
const MAX_LINEA = 260, MAX_OPCION = 96, MAX_PREGUNTA = 72, MAX_PARRAFO = 420;

const pal = (lista) => new RegExp(String.raw`(?<![\p{L}\p{N}])(?:${lista})(?![\p{L}\p{N}])`, 'iu');
const INGLES = pal("the|and|you|your|with|this|that|have|from|they|will|would|there|here|what|when|where|which|are|was|were|not|but|for|into|our|his|her|she|him|its|okay|hello|sorry|please|thanks|yes|don't|can't|it's");
const SAGRADO = pal("dios|diablo|santo|santa|santos|virgen|ángel|ángeles|angeles|cruz|rez\\p{L}*|oración|infierno|demonio\\p{L}*|iglesia|capilla|misa|altar|bautiz\\p{L}*|cristo|jesús|plegaria|bendito|pachamama|gauchito|difunta correa|nguillatún|kalku|machi|bendec\\p{L}*|bendic\\p{L}*|sagrad\\p{L}*|ofrenda\\p{L}*|milagro\\p{L}*|cielo santo|pecado\\p{L}*|tumba|funeral\\p{L}*|rito|ritual\\p{L}*");
const EXPLICITO = pal("sexo|sexual\\p{L}*|desnud\\p{L}*|tetas?|pene|verga|coger|cogiendo|culo|orgasm\\p{L}*|erótic\\p{L}*|follar|concha|puta\\p{L}*|mierda|carajo|boludo\\p{L}*|pija|cama|camas|bes[oa]\\p{L}*|sábanas|abraz\\p{L}*|amantes?");
const INEXISTENTE = pal("hospedaje|hotel|posada|hostal|pensión|escuela de música|farmacia|banco de la aldea");

// ---------------------------------------------------------------- lo que existe en el juego
const FUENTES = { gente: leer('src/gente.js'), aldea: leer('src/aldea.js'), campo: leer('src/gente-campo.js'), config: leer('src/config.js') };
const CLAVES = (() => {
  const r = new Set();
  for (const m of FUENTES.gente.matchAll(/^  ([a-z]+): \{ nombre:/gm)) r.add(m[1]);
  for (const m of FUENTES.aldea.matchAll(/^  ([a-z]+): \{\s*$/gm)) r.add(m[1]);
  for (const m of FUENTES.campo.matchAll(/^  ([a-z]+): \{\s*$/gm)) r.add(m[1]);
  return r;
})();
const LUGARES = (() => {
  const r = new Set();
  for (const m of FUENTES.config.matchAll(/^  ([a-z]+): \{ x:/gm)) r.add(m[1]);
  for (const m of ['src/estructuras.js', 'src/trochita.js', 'src/terreno.js'].map(leer).join('\n').matchAll(/lugares\.([a-z]+) *=/g)) r.add(m[1]);
  return r;
})();
const TEXTO_JUEGO = FUENTES.aldea + FUENTES.gente + FUENTES.campo;
const ESCENAS_ACTOS = { ...ESCENAS_ACTO1, ...ESCENAS_ACTO2, ...ESCENAS_ACTO3 };
const TEXTOS_ACTOS = { 1: TEXTO_ACTO1, 2: TEXTO_ACTO2, 3: TEXTO_ACTO3 };
// todas las optativas que el guion lista en los capítulos de los actos (id → capítulos)
const OPTATIVAS_GUION = (() => {
  const r = {};
  for (const T of Object.values(TEXTOS_ACTOS)) for (const [num, cap] of Object.entries(T.capitulos || {})) for (const o of cap.optativas || []) (r[o.id] ||= []).push(Number(num));
  return r;
})();
// optativa → escenas de los actos que la cuentan como hecha (por su tabla de disparo)
const ESCENAS_DE_OPTATIVA_ACTOS = (() => {
  const r = {};
  for (const D of [DISPARO_ACTO1, DISPARO_ACTO2, DISPARO_ACTO3]) for (const [id, d] of Object.entries(D)) if (d.objetivo && Object.hasOwn(OPTATIVAS_GUION, d.objetivo)) (r[d.objetivo] ||= []).push(id);
  return r;
})();
const CHARLA_ACTOS = Object.values(TEXTOS_ACTOS).flatMap((T) => Object.values(T.charla || {}).flat());
const RARO_ACTOS = { ...TEXTO_ACTO1.raro, ...TEXTO_ACTO2.raro, ...TEXTO_ACTO3.raro };
const OBJETOS_ACTOS = { ...TEXTO_ACTO1.objetos, ...TEXTO_ACTO2.objetos, ...TEXTO_ACTO3.objetos };
const ELECCIONES_ACTOS = new Set(Object.values(ESCENAS_ACTOS).flatMap((e) => e.pasos.filter((p) => p.tipo === 'eleccion').map((p) => p.id)));
const actoDeCap = (c) => (c <= 4 ? 1 : c <= 8 ? 2 : 3);

// ---------------------------------------------------------------- recorrer textos
function textosDe(e) {
  const t = [];
  const lin = (l) => { if (typeof l === 'string') t.push(l); else if (l && typeof l.texto === 'string') t.push(l.texto); };
  for (const p of e.pasos || []) {
    if (p.tipo === 'dialogo') (Array.isArray(p.lineas) ? p.lineas : [p.texto]).forEach(lin);
    if (p.tipo === 'eleccion') { t.push(p.pregunta || ''); for (const o of p.opciones || []) t.push(o.texto); }
  }
  if (typeof e.titulo === 'string') t.push(e.titulo);
  if (typeof e.resumen === 'string') t.push(e.resumen);
  return t;
}
const lineasDeDialogo = (e) => (e.pasos || []).filter((p) => p.tipo === 'dialogo').flatMap((p) => (Array.isArray(p.lineas) ? p.lineas : [p.texto])).map((l) => (typeof l === 'string' ? l : l?.texto));
function textosPlanos(obj, acc = []) {
  if (typeof obj === 'string') acc.push(obj);
  else if (Array.isArray(obj)) obj.forEach((x) => textosPlanos(x, acc));
  else if (obj && typeof obj === 'object') for (const [k, v] of Object.entries(obj)) { if (['id', 'quien', 'escena', 'optativa', 'donde'].includes(k) && typeof v === 'string') continue; textosPlanos(v, acc); }
  return acc;
}
function lugaresUsados(e) {
  const r = new Set();
  const rec = (v) => { if (Array.isArray(v)) v.forEach(rec); else if (v && typeof v === 'object') { if (typeof v.lugar === 'string') r.add(v.lugar); Object.values(v).forEach(rec); } };
  rec(e.pasos);
  return r;
}
function hablantesUsados(e) {
  const r = new Set();
  for (const p of e.pasos || []) { if (p.tipo === 'dialogo' || p.tipo === 'gesto') r.add(p.quien); }
  return r;
}

// ---------------------------------------------------------------- un mundo de mentira y el director real
function mundoFalso() {
  const claves = ['guarda', 'ramon', 'ema', 'ercilia', 'nicanor', 'abuela', 'panadera', 'fermin', 'graciela', 'carpintero', 'tobias', 'belisario', 'fotografa'];
  const actores = {};
  claves.forEach((k, i) => { actores[k] = { x: 30 + i * 3, y: 0, z: -20 - i * 2, meta: null, vel: 1.4, capt: false, visible: true }; });
  const lugares = { refugio: { x: -120, z: 232 }, estacion: { x: 300, z: 90 }, galpon: { x: 228, z: -110 }, mirador: { x: -292, z: 36 }, faro: { x: -200, z: 300 } };
  const w = {
    actores, hv: 18, sonidos: [], empezo: 0, termino: 0,
    puedeEmpezar: () => true,
    posicion(ref) {
      if (ref === 'jugador') return { x: 0, y: 0, z: 0 };
      if (typeof ref === 'string') { const a = Object.hasOwn(actores, ref) ? actores[ref] : null; return a ? { x: a.x, y: a.y, z: a.z } : null; }
      if (ref && typeof ref.lugar === 'string') { const l = Object.hasOwn(lugares, ref.lugar) ? lugares[ref.lugar] : null; return l ? { x: l.x + (ref.dx || 0), z: l.z + (ref.dz || 0) } : null; }
      if (ref && ref.frente === 'jugador') return { x: ref.lado || 0, z: -(ref.dist ?? 3) };
      return null;
    },
    suelo: () => 0,
    camaraJugador: () => ({ x: 0, y: 1.6, z: 0, yaw: 0.3, pitch: -0.1, fov: 70 }),
    horaActual: () => w.hv, hora(h) { w.hv = h; }, clima() {}, sonido(id) { w.sonidos.push(id); },
    capturar(k) { if (actores[k]) actores[k].capt = true; },
    soltar(k) { if (actores[k]) actores[k].capt = false; },
    caminar(k, d, o) { if (actores[k]) { actores[k].meta = d; actores[k].vel = o?.vel || 1.4; } },
    ocupado: (k) => !!actores[k]?.meta,
    mirar() {}, posar() {},
    aparecer(k, p) { if (actores[k]) Object.assign(actores[k], { x: p.x, y: p.y ?? 0, z: p.z, visible: true, meta: null }); },
    desaparecer(k) { if (actores[k]) actores[k].visible = false; },
    teletransportar(k, p) { if (actores[k]) Object.assign(actores[k], { x: p.x, z: p.z, meta: null }); },
    alEmpezar() { w.empezo++; }, alTerminar() { w.termino++; },
    simular(dt) {
      for (const a of Object.values(actores)) {
        if (!a.meta) continue;
        const dx = a.meta.x - a.x, dz = a.meta.z - a.z, d = Math.hypot(dx, dz), paso = a.vel * dt;
        if (d <= paso + 0.2) { a.x = a.meta.x; a.z = a.meta.z; a.meta = null; } else { a.x += dx / d * paso; a.z += dz / d * paso; }
      }
    },
  };
  return w;
}
// `eventos`: [{ id, opcion }] los eventos del valle ya pasados (con la opción que se tomó)
function correrEscena(escena, efectosLista, { script = [], decisiones = {}, eventos = [], saltarAl = -1 } = {}) {
  const mundo = mundoFalso();
  const est = { vistas: {}, elecciones: {} };
  const corridos = [], resultados = [];
  const efectos = {};
  for (const nombre of efectosLista) efectos[nombre] = (args, ctx) => { corridos.push({ nombre, args, saltando: ctx.saltando }); };
  const condiciones = {
    decision: (c) => (decisiones[c.args.d] ?? 'ninguna') === c.args.es,
    evento: (c) => eventos.some((e) => e.id === c.args.id && (c.args.opcion === undefined || e.opcion === c.args.opcion)),
  };
  const dir = crearDirector({ mundo, estado: () => est, dia: () => 3, efectos, condiciones, alTerminar: (r) => resultados.push(r) });
  const reg = dir.registrar(escena);
  const log = { lineas: [], hablantes: [], elecciones: [], camaras: 0, mundo, corridos, resultados, dir };
  if (!reg.ok) return { ...log, falloRegistro: true };
  log.faltan = dir.efectosFaltantes(escena.id);
  if (!dir.disparar(escena.id)) return { ...log, noDisparo: true };
  let ultima = '', i = 0, k = 0;
  while (dir.activa() && i++ < 60000) {
    mundo.simular(0.05);
    dir.actualizar(0.05);
    if (saltarAl >= 0 && i === saltarAl) { dir.saltar(); continue; }
    const d = dir.datos();
    if (dir.camara()) log.camaras++;
    if (d?.eleccion) {
      const idx = k < script.length ? script[k] : 0;
      log.elecciones.push({ id: d.eleccion.id, n: d.eleccion.opciones.length, tomada: idx });
      k++;
      dir.elegir(idx);
    } else if (d?.dialogo && d.fase === 'corriendo' && d.dialogo.completo) {
      const clave = `${d.dialogo.nombre}|${d.dialogo.texto}`;
      if (clave !== ultima) { log.lineas.push(d.dialogo.texto); log.hablantes.push(d.dialogo.quien); ultima = clave; }
      dir.avanzar();
    }
  }
  log.activa = dir.activa();
  return log;
}
function caminos(escena, efectosLista, base = {}) {
  const hechos = [];
  const explorar = (script) => {
    const r = correrEscena(escena, efectosLista, { ...base, script });
    hechos.push({ script, r });
    if (r.elecciones.length > script.length) for (let i = 0; i < r.elecciones[script.length].n; i++) explorar([...script, i]);
  };
  explorar([]);
  return hechos;
}
// las variantes de una escena: cada decisión que mira (a, b, c y ninguna) y el evento de la oveja (sin evento, con «buscar», con «perro»)
function variantesDe(e) {
  const decs = new Set();
  let evento = false;
  const rec = (v) => { if (Array.isArray(v)) v.forEach(rec); else if (v && typeof v === 'object') { if (v.cond === 'decision' && v.args) decs.add(v.args.d); if (v.cond === 'evento') evento = true; Object.values(v).forEach(rec); } };
  rec(e.pasos);
  let acc = [{ decisiones: {}, eventos: [] }];
  for (const dd of decs) acc = acc.flatMap((v) => ['a', 'b', 'c', null].map((x) => ({ ...v, decisiones: x ? { ...v.decisiones, [dd]: x } : { ...v.decisiones } })));
  if (evento) acc = acc.flatMap((v) => [[], [{ id: 'oveja', opcion: 'buscar' }], [{ id: 'oveja', opcion: 'perro' }]].map((ev) => ({ ...v, eventos: ev })));
  return acc;
}

// armar.mjs sólo exporta el primer nombre de `export const A = 1, B = 2`: una línea `export const` con una coma AFUERA de paréntesis, corchetes,
// llaves y textos, seguida de otro nombre y `=`, declara dos. (Las comas de adentro de un objeto, una lista o los parámetros no cuentan.)
function dosExports(linea) {
  if (!/^export\s+(?:const|let|var)\s/.test(linea)) return false;
  const s = linea.replace(/\\./g, '__').replace(/'[^']*'|"[^"]*"|`[^`]*`/g, "''");
  let hondo = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if ('([{'.includes(ch)) hondo++;
    else if (')]}'.includes(ch)) hondo--;
    else if (ch === ',' && hondo === 0 && /^,\s*[A-Za-z_$][\w$]*\s*=(?!=|>)/.test(s.slice(i))) return true;
  }
  return false;
}

// ---------------------------------------------------------------- LA SUITE: recibe los módulos (reales o mutados) y devuelve lo que falló
function todo(ME, MT, textoE, textoT) {
  const f = [];
  const c = (cond, t) => { if (!cond) f.push(t); };
  const ESC = ME.ESCENAS_OPTATIVAS || {}, DIS = ME.DISPARO_OPTATIVAS || {}, EFS = ME.EFECTOS_OPTATIVAS || [];
  const TEX = MT.TEXTO_OPTATIVAS || {};
  const ids = Object.keys(ESC), escenas = Object.values(ESC);

  // 0) los exports que el que junta espera
  c(Array.isArray(ME.IDS_OPTATIVAS) && ME.IDS_OPTATIVAS.join() === ids.join(), 'IDS_OPTATIVAS no son los ids de ESCENAS_OPTATIVAS');
  c(ME.POR_DEFECTO_OPTATIVAS && typeof ME.POR_DEFECTO_OPTATIVAS === 'object' && !Array.isArray(ME.POR_DEFECTO_OPTATIVAS), 'falta POR_DEFECTO_OPTATIVAS');
  c(typeof MT.charlaOptativas === 'function' && typeof MT.tablonDe === 'function', 'faltan charlaOptativas o tablonDe');

  // 1) ids exactos, sin chocar con los actos
  c(IDS_PEDIDOS.every((id) => ids.includes(id)) && ids.length === IDS_PEDIDOS.length, 'escenas de más o de menos: ' + ids.join(','));
  c(Object.entries(ESC).every(([k, e]) => e && e.id === k), 'el id de cada escena coincide con su clave');
  c(ids.every((id) => !Object.hasOwn(ESCENAS_ACTOS, id)), 'un id de escena choca con los actos');
  c(ids.every((id) => /^[a-z0-9][a-z0-9-]*$/.test(id)), 'ids de escena sólo con minúsculas sin ñ, números y guiones');

  // 2) válidas, con resumen, en su acto y capítulo
  for (const e of escenas) {
    const v = validarEscena(e);
    c(v.ok, `${e?.id}: no valida (${(v.errores || []).join('; ')})`);
    c(typeof e.resumen === 'string' && e.resumen.length > 20, `${e?.id}: sin resumen`);
    c(typeof e.titulo === 'string' && e.titulo.length > 2, `${e?.id}: sin título`);
    c(e.capitulo >= 1 && e.capitulo <= 13 && e.acto === actoDeCap(e.capitulo), `${e?.id}: acto ${e?.acto} y capítulo ${e?.capitulo} no coinciden`);
    c(!e.efimera, `${e?.id}: no puede ser efímera`);
    const planos = e.pasos.filter((p) => p.tipo === 'plano').length;
    c(planos >= 2, `${e.id}: menos de dos planos de cámara`);
    c(e.pasos.some((p) => p.tipo === 'dialogo'), `${e.id}: sin diálogo`);
  }

  // 3) efectos y condiciones: la convención
  const usados = new Set(escenas.flatMap((e) => efectosDe(e)));
  for (const e of escenas) {
    for (const nombre of efectosDe(e)) c(parsearEfectoActo3(nombre), `${e.id}: el efecto «${nombre}» no sigue la convención`);
    for (const cond of condicionesDe(e)) c(CONDICIONES_ACTO3.includes(cond), `${e.id}: la condición «${cond}» no está en la convención`);
    const elecs = new Set(e.pasos.filter((p) => p.tipo === 'eleccion').map((p) => p.id));
    for (const p of e.pasos) if (p.si && typeof p.si.eleccion === 'string') c(elecs.has(p.si.eleccion), `${e.id}: mira la elección «${p.si.eleccion}», que no existe`);
    // ninguna línea tiene un objeto colado (un `{ si }` pasado como línea a narra)
    for (const p of e.pasos.filter((q) => q.tipo === 'dialogo')) for (const l of p.lineas || []) c(typeof l === 'string' || (l && typeof l.texto === 'string'), `${e.id}: una línea de diálogo no es texto`);
  }
  c([...usados].every((x) => EFS.includes(x)) && EFS.every((x) => usados.has(x)), 'EFECTOS_OPTATIVAS no es exactamente lo que usan las escenas');
  for (const k of CLAVES_NUEVAS) c(usados.has(k), `la clave nueva «${k}» no la usa ninguna escena`);

  // 4) las elecciones
  const vistasElec = new Set(ELECCIONES_ACTOS);
  let total = 0, conEfecto = 0;
  for (const e of escenas) for (const p of e.pasos.filter((q) => q.tipo === 'eleccion')) {
    total++;
    c(!vistasElec.has(p.id), `${e.id}/${p.id}: id de elección repetido`);
    vistasElec.add(p.id);
    c(p.opciones.length >= 2 && p.opciones.length <= 3, `${e.id}/${p.id}: de 2 a 3 opciones`);
    c(Number.isInteger(p.porDefecto) && p.porDefecto >= 0 && p.porDefecto < p.opciones.length, `${e.id}/${p.id}: porDefecto inválido`);
    c((p.pregunta || '').length > 3 && p.pregunta.length <= MAX_PREGUNTA, `${e.id}/${p.id}: pregunta ausente o larga`);
    for (const o of p.opciones) {
      c(!!o.efecto !== (o.sabor === true), `${e.id}/${p.id}/${o.id}: la opción tiene que tener efecto o ser de sabor (y no las dos)`);
      if (o.efecto) conEfecto++;
      c(typeof o.texto === 'string' && o.texto.length <= MAX_OPCION, `${e.id}/${p.id}/${o.id}: opción demasiado larga`);
    }
  }
  c(total >= 8, `pocas elecciones (${total})`);
  c(conEfecto >= 3, `pocas elecciones con peso (${conEfecto})`);

  // 5) hablantes, claves, poses, lugares
  for (const e of escenas) {
    const decl = { ...PERSONAJES_BASE, ...(e.personajes || {}) };
    for (const q of hablantesUsados(e)) c(q && Object.hasOwn(decl, q), `${e.id}: hablante o actor sin declarar «${q}»`);
    for (const [k, pjx] of Object.entries(e.personajes || {})) {
      if (pjx.clave) c(CLAVES.has(pjx.clave) || CLAVES_PEDIDAS.includes(pjx.clave), `${e.id}: «${k}» usa la clave «${pjx.clave}» que no existe`);
      c(typeof pjx.nombre === 'string' && /^#[0-9a-f]{6}$/i.test(pjx.color || ''), `${e.id}: personaje «${k}» sin nombre o color`);
    }
    for (const p of e.pasos) if (p.tipo === 'gesto' && p.accion === 'posar') c(POSES_ESCENA.includes(p.pose), `${e.id}: pose «${p.pose}» desconocida`);
    for (const l of e.pasos.filter((p) => p.tipo === 'dialogo').flatMap((p) => p.lineas)) if (l && l.gesto) c(POSES_ESCENA.includes(l.gesto.pose), `${e.id}: pose de línea «${l.gesto.pose}» desconocida`);
    for (const l of lugaresUsados(e)) c(LUGARES.has(l), `${e.id}: el lugar «${l}» no existe`);
  }

  // 6) los textos
  const revisar = (t, donde) => {
    c(!INGLES.test(t), `${donde}: inglés en «${t.slice(0, 50)}»`);
    c(!SAGRADO.test(t), `${donde}: palabra religiosa en «${t.slice(0, 50)}»`);
    c(!EXPLICITO.test(t), `${donde}: palabra explícita en «${t.slice(0, 50)}»`);
    c(!INEXISTENTE.test(t), `${donde}: nombra algo que no existe en «${t.slice(0, 50)}»`);
    for (const m of t.matchAll(/(?<=[a-záéíóúñ,;:] )([A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,})/g)) c(NOMBRES_OK.has(m[1]), `${donde}: nombre propio que no existe «${m[1]}»`);
  };
  for (const e of escenas) {
    for (const l of lineasDeDialogo(e)) c(typeof l === 'string' && l.trim().length > 0 && l.length <= MAX_LINEA, `${e.id}: línea vacía o larga`);
    for (const t of textosDe(e)) revisar(t, e.id);
  }
  for (const t of textosPlanos(TEX)) { revisar(t, 'texto'); c(t.length <= MAX_PARRAFO, `texto: párrafo largo «${t.slice(0, 40)}»`); }
  for (const p of PERSONAS_REALES) c(TEXTO_JUEGO.includes(p), `la persona «${p}» no está en el juego`);

  // 7) el cuaderno de lo raro y los objetos
  const raros = TEX.raro || {};
  for (const [id, r] of Object.entries(raros)) {
    c(parsearEfectoActo3(`raro:${id}`) && !Object.hasOwn(RARO_ACTOS, id), `raro «${id}»: fuera de la convención o repetido con los actos`);
    c(r && typeof r.texto === 'string' && r.texto.length > 15 && typeof r.titulo === 'string' && r.cap >= 1 && r.cap <= 13 && typeof r.donde === 'string', `raro «${id}»: incompleto`);
    c(usados.has(`raro:${id}`), `raro «${id}»: ninguna escena lo anota`);
  }
  for (const nombre of usados) {
    const p = parsearEfectoActo3(nombre);
    if (p?.tipo === 'raro') c(Object.hasOwn(raros, p.id), `raro «${p.id}» sin texto`);
    if (p?.tipo === 'objeto' || p?.tipo === 'entrega') c(Object.hasOwn(TEX.objetos || {}, p.id) || Object.hasOwn(OBJETOS_ACTOS, p.id), `objeto «${p.id}» sin texto`);
  }
  // cada raro anotado está en el capítulo de su escena
  for (const e of escenas) for (const nombre of efectosDe(e)) if (nombre.startsWith('raro:')) c(raros[nombre.slice(5)]?.cap === e.capitulo, `raro «${nombre}»: el capítulo no es el de su escena`);

  // 8) el tablón: las 28 optativas del guion, ni una más
  const tab = TEX.tablon || {};
  for (const [id, caps] of Object.entries(OPTATIVAS_GUION)) {
    const t = tab[id];
    c(!!t, `tablón: falta la optativa «${id}»`);
    if (!t) continue;
    c(Array.isArray(t.caps) && caps.every((x) => t.caps.includes(x)), `tablón «${id}»: no está en los capítulos ${caps.join(',')}`);
    c(typeof t.titulo === 'string' && t.titulo.length > 3 && typeof t.ofrecida === 'string' && t.ofrecida.length > 20 && typeof t.hecha === 'string' && t.hecha.length > 15 && t.ofrecida !== t.hecha, `tablón «${id}»: incompleto`);
    c(typeof t.quien === 'string', `tablón «${id}»: sin quién`);
  }
  c(Object.keys(tab).every((id) => Object.hasOwn(OPTATIVAS_GUION, id)), 'tablón: una optativa que el guion no tiene');
  c(Object.keys(tab).length === 28, `tablón: tienen que ser 28 (${Object.keys(tab).length})`);

  // 9) la tabla de disparo
  for (const id of ids) {
    const d = DIS[id];
    c(!!d && typeof d.jugadorEn === 'string' && typeof d.cuando === 'string' && d.cap === ESC[id].capitulo, `${id}: sin disparo o con otro capítulo`);
    if (!d) continue;
    if (d.objetivo !== null) c(Object.hasOwn(OPTATIVAS_GUION, d.objetivo) && OPTATIVAS_GUION[d.objetivo].includes(d.cap), `${id}: la optativa «${d.objetivo}» no es del capítulo ${d.cap}`);
    if (d.ofrece !== null) c(Object.hasOwn(ESCENAS_ACTOS, d.ofrece) && efectosDe(ESCENAS_ACTOS[d.ofrece]).includes(`optativa:${d.objetivo}`), `${id}: «${d.ofrece}» no ofrece la optativa «${d.objetivo}»`);
  }
  c(Object.keys(DIS).every((id) => Object.hasOwn(ESC, id)), 'la tabla de disparo tiene escenas de más');

  // 10) la charla de después: cada optativa que se cumple con una escena tiene su línea (en los actos o acá)
  const charla = TEX.charla || {};
  const lineas = Object.entries(charla).flatMap(([q, l]) => (Array.isArray(l) ? l.map((x) => ({ ...x, quien: q })) : []));
  const idsCh = lineas.map((x) => x.id);
  c(new Set(idsCh).size === idsCh.length && idsCh.every((id) => !CHARLA_ACTOS.some((x) => x.id === id)), 'charla: ids repetidos (entre sí o con los actos)');
  const todasEscenas = { ...ESCENAS_ACTOS, ...ESC };
  for (const x of lineas) {
    c(typeof x.texto === 'string' && x.texto.length > 20 && x.texto.length <= MAX_LINEA && x.cap >= 1 && x.cap <= 13, `charla ${x.id}: inválida`);
    const w = x.cuando || {};
    c(!!w.escena !== !!w.optativa, `charla ${x.id}: tiene que mirar una escena o una optativa (sólo una)`);
    if (w.escena) c(Object.hasOwn(todasEscenas, w.escena) && (todasEscenas[w.escena].capitulo || 0) <= x.cap, `charla ${x.id}: la escena «${w.escena}» no existe o es de un capítulo posterior`);
    if (w.optativa) c(Object.hasOwn(OPTATIVAS_GUION, w.optativa) && !ESCENAS_DE_OPTATIVA_ACTOS[w.optativa] && !Object.values(DIS).some((d) => d.objetivo === w.optativa), `charla ${x.id}: «${w.optativa}» tiene escena: que mire la escena`);
  }
  const escenasDe = { ...ESCENAS_DE_OPTATIVA_ACTOS };
  for (const [id, d] of Object.entries(DIS)) if (d.objetivo) (escenasDe[d.objetivo] ||= []).push(id);
  const todasLasLineas = [...CHARLA_ACTOS, ...lineas];
  for (const [opt, escs] of Object.entries(escenasDe)) {
    if (opt === 'alguien-te-espera') continue;   // la pareja habla con el sistema del amor, no con la charla de historia
    const tieneLinea = todasLasLineas.some((x) => x.cuando && (x.cuando.optativa === opt || escs.includes(x.cuando.escena)));
    c(tieneLinea, `la optativa «${opt}» no tiene charla de después`);
  }
  c(Object.values(escenasDe).flat().every((s) => Object.hasOwn(todasEscenas, s)), 'una optativa apunta a una escena que no existe');

  // 11) las escenas corren por todos los caminos y variantes, y se saltan
  for (const [id, e] of Object.entries(ESC)) {
    for (const v of variantesDe(e)) for (const { script, r } of caminos(e, EFS, v)) {
      const rot = `${id} [${script.join(',')}] ${JSON.stringify(v)}`;
      c(!r.falloRegistro && !r.noDisparo && r.faltan?.length === 0, `${rot}: registra, dispara y tiene sus efectos`);
      c(!r.activa && r.resultados.length === 1 && r.resultados[0].errores.length === 0, `${rot}: termina sin errores (${r.resultados[0]?.errores?.join('; ')})`);
      c(r.dir.vista(id) && r.mundo.empezo === 1 && r.mundo.termino === 1, `${rot}: queda vista, empieza y termina una vez`);
      c(Object.values(r.mundo.actores).every((a) => !a.capt), `${rot}: suelta a todos`);
      c(r.camaras > 5 && r.lineas.length >= 2, `${rot}: cámara y líneas`);
      for (const el of r.elecciones) {
        const o = e.pasos.find((p) => p.tipo === 'eleccion' && p.id === el.id)?.opciones[el.tomada];
        if (o?.efecto) c(r.corridos.some((x) => x.nombre === o.efecto), `${rot}: la opción ${o.id} no corrió ${o.efecto}`);
      }
    }
    for (const cuando of [2, 40, 300, 1500]) {
      const r = correrEscena(e, EFS, { saltarAl: cuando });
      c(!r.activa && r.dir.vista(id) && r.resultados.length === 1 && r.resultados[0].errores.length === 0, `${id}: se salta a los ${cuando} cuadros`);
    }
  }

  // 12) lo que cada escena tiene que hacer (el guion)
  const E = (id) => ESC[id] || { id, pasos: [] };
  const corre = (id, o = {}) => correrEscena(E(id), EFS, o);
  const nombres = (r) => (r.corridos || []).map((x) => x.nombre);
  const dice = (id, o, re) => (corre(id, o).lineas || []).some((l) => re.test(l));
  {
    const r = corre('frasco-repisa');
    c(nombres(r).includes('objeto:frasco-masa-madre') && nombres(r).includes('raro:frasco-de-1987'), 'frasco-repisa: el frasco va a la mochila');
    c(nombres(corre('frasco-repisa', { saltarAl: 3 })).includes('objeto:frasco-masa-madre'), 'frasco-repisa: saltarla igual da el frasco');
    const rr = corre('frasco-rosa');
    const pan = rr.corridos?.find((x) => x.nombre === 'mundo:pan-de-rosa');
    c(nombres(rr).includes('entrega:frasco-masa-madre') && nombres(rr).includes('lazo:rosa:1') && pan?.args?.dias === 3 && pan?.args?.cosa === 'pan-casero' && pan?.args?.n === 1, 'frasco-rosa: entrega el frasco, Rosa +1 y pan tres mañanas');
    c(!nombres(rr).some((x) => x.startsWith('dar:')), 'frasco-rosa: el pan lo da A con mundo:pan-de-rosa (sin dar: duplicado)');
    c(dice('frasco-rosa', { decisiones: { bolsa: 'b' } }, /en cuotas/) && !dice('frasco-rosa', { decisiones: { bolsa: 'a' } }, /en cuotas/) && dice('frasco-rosa', { decisiones: { bolsa: 'a' } }, /adonde sea/) && !dice('frasco-rosa', { decisiones: { bolsa: 'b' } }, /adonde sea/), 'frasco-rosa: Rosa recuerda la harina sólo si D1 = b');
    const ov = (ev) => corre('oveja-ramon', { eventos: ev });
    c(nombres(ov([])).includes('lazo:ramon:1') && nombres(ov([])).includes('mundo:majada-pasa') && nombres(ov([])).includes('raro:la-porfiada'), 'oveja-ramon: Ramón +1, la majada y el cuaderno');
    c(ov([{ id: 'oveja', opcion: 'perro' }]).lineas.some((l) => /arrea como yo bailo/.test(l)) && !ov([{ id: 'oveja', opcion: 'perro' }]).lineas.some((l) => /Se te nota en las botas/.test(l)), 'oveja-ramon: con el perro, Ramón se ríe del perro');
    c(ov([{ id: 'oveja', opcion: 'buscar' }]).lineas.some((l) => /Se te nota en las botas/.test(l)) && !ov([{ id: 'oveja', opcion: 'buscar' }]).lineas.some((l) => /arrea como yo bailo/.test(l)), 'oveja-ramon: si la arreaste vos, te mira las botas');
    const p0 = corre('pan-fermin', { script: [0] }), p1 = corre('pan-fermin', { script: [1] });
    c(nombres(p0).includes('quitar:pan-casero:1') && !nombres(p0).includes('quitar:harina:1') && nombres(p1).includes('quitar:harina:1') && !nombres(p1).includes('quitar:pan-casero:1'), 'pan-fermin: gasta lo que le das (pan o harina), una sola cosa');
    c(nombres(p0).includes('lazo:fermin:1') && nombres(p1).includes('lazo:fermin:1') && p0.lineas.some((l) => /espantaba zorros/.test(l)), 'pan-fermin: Fermín +1 y la honda insinuada');
    c(nombres(corre('pan-fermin', { saltarAl: 3 })).includes('quitar:pan-casero:1'), 'pan-fermin: saltarla deja el pan (opción por defecto)');
    for (const id of ['vuelta-mirador', 'vuelta-faro']) {
      const q = nombres(corre(id));
      c(!q.some((x) => x.startsWith('lazo:') || x.startsWith('ramal:')), `${id}: no da lazo ni ramal (el premio es de te-graciela o del registro)`);
      c(corre(id).hablantes.includes('graciela'), `${id}: habla Graciela`);
    }
    c(dice('vuelta-mirador', {}, /parece un piolín/) && dice('vuelta-faro', {}, /botas eran para oficinas/), 'las dos vueltas tienen su frase');
    const ja = corre('juntar-ovejas', { decisiones: { majada: 'a' } }), jb = corre('juntar-ovejas', { decisiones: { majada: 'b' } }), jc = corre('juntar-ovejas', { decisiones: { majada: 'c' } });
    c(ja.hablantes.includes('fermin') && !jb.hablantes.includes('fermin') && !jc.hablantes.includes('fermin'), 'juntar-ovejas: Fermín sólo si se lleva la majada (D5 = a)');
    c(jc.hablantes.includes('belisario') && !ja.hablantes.includes('belisario') && !jb.hablantes.includes('belisario'), 'juntar-ovejas: Belisario sólo si la vendiste (D5 = c)');
    c(['mundo:ovejas-juntas', 'lazo:ramon:1', 'raro:ovejas-juntas'].every((x) => nombres(jb).includes(x)) && nombres(corre('juntar-ovejas', { script: [1] })).includes('quitar:yerba:1') && !nombres(corre('juntar-ovejas', { script: [0] })).includes('quitar:yerba:1'), 'juntar-ovejas: cierra el corral, Ramón +1; la yerba sólo si la dejás');
    c(nombres(corre('juntar-ovejas', { saltarAl: 3 })).includes('mundo:ovejas-juntas'), 'juntar-ovejas: saltarla igual cierra el corral');
  }

  // 13) la charla y el tablón (funciones)
  if (typeof MT.charlaOptativas === 'function' && typeof MT.tablonDe === 'function') {
    const ch = MT.charlaOptativas;
    c(ch('ramon', 2, {}) === null && ch('ramon', 2, { escenas: ['oveja-ramon'] })?.id === 'ramon-opt-porfiada', 'charla: sin la escena no hay línea; con la escena, la de la Porfiada');
    c(ch('ramon', 1, { escenas: ['oveja-ramon'] }) === null, 'charla: antes de su capítulo no aparece');
    c(ch('ramon', 9, { escenas: new Set(['oveja-ramon', 'juntar-ovejas']) })?.id === 'ramon-opt-ovejas' && ch('ramon', 9, { escenas: ['oveja-ramon', 'visita-ramon', 'juntar-ovejas'] })?.id === 'ramon-opt-visita', 'charla: gana la del capítulo más nuevo; en el mismo, la primera de la lista');
    c(ch('ramon', 12, { escenas: ['oveja-ramon'] })?.id === 'ramon-opt-porfiada', 'charla: la última línea dicha sigue valiendo en capítulos posteriores');
    c(ch('ercilia', 7, { optativas: ['concurso'] })?.id === 'ercilia-opt-dulce' && ch('ercilia', 7, { escenas: ['concurso'] }) === null, 'charla: el concurso (sin escena) mira la optativa hecha');
    c(ch('nadie', 9, { escenas: ['juntar-ovejas'] }) === null && ch('constructor', 9, {}) === null, 'charla: sin línea para quien no está (ni claves peligrosas)');
    c(MT.tablonDe('oveja')?.texto === TEX.tablon?.oveja?.ofrecida && MT.tablonDe('oveja', true)?.texto === TEX.tablon?.oveja?.hecha && MT.tablonDe('no-existe') === null && MT.tablonDe('constructor') === null, 'tablonDe: la pista abierta, la línea hecha, y null si no existe');
  }

  // 14) el código: reglas del empaquetador (armar.mjs) y de módulo puro
  for (const [a, t] of [[ARCH_ESC, textoE], [ARCH_TEX, textoT]]) {
    for (const m of t.matchAll(/^export\s+(?:const|let|var|function|class)\s+([^\s=(]+)/gm)) c(/^[A-Za-z0-9_$]+$/.test(m[1]), `${a}: el export «${m[1]}» tiene caracteres raros`);
    c(!/^export\s*\{/m.test(t) && !/^export\s+(?:async|\*|default)/m.test(t), `${a}: sólo exports que entiende armar.mjs`);
    c(!t.split('\n').some(dosExports), `${a}: un export const por línea`);
    for (const m of t.matchAll(/^import\s.*$/gm)) c(/^import\s+\{[^}]+\}\s+from\s+'\.\/[a-z0-9-]+\.js';$/.test(m[0]), `${a}: import en una sola línea`);
    c(!t.includes('\r'), `${a}: fines de línea LF`);
    c(!/\b(three|THREE|document|window)\b/.test(t.replace(/\/\/.*$/gm, '')), `${a}: puro (sin three ni DOM)`);
    c(!/scratch/i.test(t), `${a}: no menciona lo que no se menciona`);
    c(!/ñ/.test(t.replace(/\/\/.*$/gm, '').replace(/'[^'\n]*'|"[^"\n]*"|`[^`\n]*`/g, '')), `${a}: una ñ fuera de los textos (ids y nombres sin ñ)`);
  }
  const previos = ['src/historia-escenas-acto1.js', 'src/historia-texto-acto1.js', 'src/historia-escenas-acto2.js', 'src/historia-texto-acto2.js', 'src/historia-escenas-acto3.js', 'src/historia-texto-acto3.js', 'src/historia-escenas-util.js', 'src/historia-escenas-acto2-util.js', 'src/historia-escenas-acto3-util.js'].map(leer).join('\n');
  const mios = [...(textoE + '\n' + textoT).matchAll(/^export\s+(?:const|function)\s+([A-Za-z0-9_$]+)/gm)].map((m) => m[1]);
  c(new Set(mios).size === mios.length && mios.every((x) => !new RegExp(`^export\\s+(?:const|function)\\s+${x}\\b`, 'm').test(previos)), 'los nombres exportados chocan entre sí o con los actos');
  for (const x of ['ESCENAS_OPTATIVAS', 'IDS_OPTATIVAS', 'EFECTOS_OPTATIVAS', 'DISPARO_OPTATIVAS', 'POR_DEFECTO_OPTATIVAS']) c(new RegExp(`^export const ${x} =`, 'm').test(textoE), `${ARCH_ESC}: falta el export «${x}»`);
  for (const x of ['TEXTO_OPTATIVAS', 'charlaOptativas', 'tablonDe']) c(new RegExp(`^export (?:const|function) ${x}\\b`, 'm').test(textoT), `${ARCH_TEX}: falta el export «${x}»`);
  return f;
}

// ---------------------------------------------------------------- los datos reales
const ruta = (dir, arch) => pathToFileURL(join(dir, arch.replace('src/', ''))).href;
let version = 0;
async function cargar(dir) {
  version++;
  const ME = await import(ruta(dir, ARCH_ESC) + '?v=' + version);
  const MT = await import(ruta(dir, ARCH_TEX) + '?v=' + version);
  return { ME, MT, textoE: readFileSync(join(dir, ARCH_ESC.replace('src/', '')), 'utf8'), textoT: readFileSync(join(dir, ARCH_TEX.replace('src/', '')), 'utf8') };
}
const real = await cargar(join(raiz, 'src'));
const reales = todo(real.ME, real.MT, real.textoE, real.textoT);
ok(reales.length === 0, 'la suite pasa sobre los datos reales: ' + reales.slice(0, 15).join(' | ') + (reales.length > 15 ? ` (+${reales.length - 15})` : ''));
ok(real.ME.IDS_OPTATIVAS.length === 7, 'siete escenas nuevas');
ok(Object.keys(OPTATIVAS_GUION).length === 28, `el guion tiene 28 optativas en los actos (${Object.keys(OPTATIVAS_GUION).length})`);

// los pedidos para A, documentados; la prueba en verify:pasos
{
  const cambios = existsSync(join(raiz, 'CAMBIOS_4_18_0_B.md')) ? leer('CAMBIOS_4_18_0_B.md') : '';
  ok(cambios.length > 2500, 'existe CAMBIOS_4_18_0_B.md');
  for (const id of real.ME.IDS_OPTATIVAS) ok(cambios.includes('`' + id + '`'), `CAMBIOS_4_18_0_B.md lista la escena «${id}»`);
  for (const k of CLAVES_NUEVAS) ok(cambios.includes('`' + k + '`'), `CAMBIOS_4_18_0_B.md documenta la clave «${k}»`);
  for (const id of Object.keys(real.MT.TEXTO_OPTATIVAS.raro)) ok(cambios.includes(id), `CAMBIOS_4_18_0_B.md lista el raro «${id}»`);
  for (const x of ['charlaOptativas', 'tablonDe', 'evento', 'quitar:yerba:1', 'quitar:pan-casero:1', 'te-graciela', 'PERSONAS_LAZO']) ok(cambios.includes(x), `CAMBIOS_4_18_0_B.md explica «${x}»`);
  ok(!/scratch/i.test(cambios) && !INGLES.test(cambios.replace(/`[^`]*`/g, '')), 'los cambios, en castellano y sin mencionar lo que no se menciona');
  const pkg = JSON.parse(leer('package.json'));
  ok(/node pruebas\/verificar-4-18-0-escenas-optativas\.mjs/.test(pkg.scripts?.['verify:pasos'] || ''), 'la prueba está en verify:pasos');
}

// ---------------------------------------------------------------- MUTACIONES de datos: se clona lo exportado y se rompe una garantía
const clon = (o) => JSON.parse(JSON.stringify(o));
function mutanteDatos(tocar) {
  const ME = { ...real.ME, ESCENAS_OPTATIVAS: clon(real.ME.ESCENAS_OPTATIVAS), DISPARO_OPTATIVAS: clon(real.ME.DISPARO_OPTATIVAS), EFECTOS_OPTATIVAS: [...real.ME.EFECTOS_OPTATIVAS], IDS_OPTATIVAS: [...real.ME.IDS_OPTATIVAS] };
  const MT = { ...real.MT, TEXTO_OPTATIVAS: clon(real.MT.TEXTO_OPTATIVAS) };
  tocar(ME.ESCENAS_OPTATIVAS, MT.TEXTO_OPTATIVAS, ME.DISPARO_OPTATIVAS, ME);
  return todo(ME, MT, real.textoE, real.textoT);
}
const dial = (e) => e.pasos.find((p) => p.tipo === 'dialogo');
const elec = (e, id) => e.pasos.find((p) => p.tipo === 'eleccion' && p.id === id);
const MUT_DATOS = [
  ['falta una escena', (e) => { delete e['juntar-ovejas']; }],
  ['una escena de más', (e) => { e['extra'] = { ...clon(e['vuelta-faro']), id: 'extra' }; }],
  ['el id no coincide con la clave', (e) => { e['pan-fermin'].id = 'pan-otro'; }],
  ['un id que choca con un acto', (e) => { const x = e['vuelta-faro']; delete e['vuelta-faro']; e['te-graciela'] = { ...x, id: 'te-graciela' }; }],
  ['acto mal puesto', (e) => { e['juntar-ovejas'].acto = 1; }],
  ['un plano desconocido', (e) => { e['oveja-ramon'].pasos.find((p) => p.tipo === 'plano').plano = 'cenital'; }],
  ['un solo plano', (e) => { const pl = e['vuelta-faro'].pasos.filter((p) => p.tipo === 'plano'); e['vuelta-faro'].pasos = e['vuelta-faro'].pasos.filter((p) => !pl.slice(1).includes(p)); }],
  ['una escena sin resumen', (e) => { delete e['frasco-rosa'].resumen; }],
  ['una escena efímera', (e) => { e['frasco-repisa'].efimera = true; }],
  ['una opción sin efecto ni sabor', (e) => { delete elec(e['oveja-ramon'], 'porfiada-resp').opciones[0].sabor; }],
  ['una opción con efecto y sabor', (e) => { elec(e['pan-fermin'], 'fermin-pan-que').opciones[0].sabor = true; }],
  ['cuatro opciones', (e) => { elec(e['vuelta-faro'], 'faro-graciela').opciones.push({ id: 'otra', texto: 'Otra.', sabor: true }); }],
  ['una elección repetida con un acto', (e) => { elec(e['vuelta-mirador'], 'mirador-graciela').id = 'mirador-resp'; }],
  ['una elección repetida entre escenas', (e) => { elec(e['vuelta-mirador'], 'mirador-graciela').id = 'faro-graciela'; }],
  ['un paso que mira una elección inexistente', (e) => { e['pan-fermin'].pasos.push({ tipo: 'dialogo', quien: 'narra', lineas: ['Hola, hola.'], si: { eleccion: 'no-hay', es: 'a' } }); }],
  ['un condicional colado como línea', (e) => { dial(e['frasco-repisa']).lineas.push({ si: { eleccion: 'frasco-hablar', es: 'tela' } }); }],
  ['una línea larguísima', (e) => { dial(e['frasco-rosa']).lineas.push('Larguísimo. '.repeat(30)); }],
  ['una opción larguísima', (e) => { elec(e['juntar-ovejas'], 'ovejas-poste').opciones[0].texto = 'Dejarlo atado porque no es mío y no se toca '.repeat(3); }],
  ['inglés', (e) => { dial(e['vuelta-faro']).lineas.push('Una frase with algo raro.'); }],
  ['religión', (e) => { dial(e['oveja-ramon']).lineas.push('Gracias a Dios volvió la oveja.'); }],
  ['algo explícito', (e) => { dial(e['vuelta-faro']).lineas.push('Se dieron un beso largo.'); }],
  ['algo que no existe en el juego', (e) => { dial(e['vuelta-mirador']).lineas.push('Mañana vuelvo al hospedaje.'); }],
  ['una persona que no existe', (e) => { dial(e['pan-fermin']).lineas.push('Me lo dijo la tía Hortensia.'); }],
  ['un hablante sin declarar', (e) => { dial(e['oveja-ramon']).quien = 'ramoncito'; }],
  ['una clave que no existe', (e) => { e['pan-fermin'].personajes.fermin.clave = 'fermin2'; }],
  ['una pose que no existe', (e) => { e['oveja-ramon'].pasos.push({ tipo: 'gesto', quien: 'ramon', accion: 'posar', pose: 'volar' }); }],
  ['un lugar que no existe', (e) => { e['vuelta-faro'].pasos.find((p) => p.tipo === 'plano' && p.a?.lugar).a = { lugar: 'aeropuerto' }; }],
  ['un efecto fuera de la convención', (e) => { e['frasco-rosa'].pasos.push({ tipo: 'efecto', nombre: 'regalo:pan' }); }],
  ['un lazo exagerado', (e) => { e['oveja-ramon'].pasos.push({ tipo: 'efecto', nombre: 'lazo:ramon:7' }); }],
  ['una condición fuera de la convención', (e) => { e['juntar-ovejas'].pasos.push({ tipo: 'dialogo', quien: 'narra', lineas: ['Hola, hola.'], si: { cond: 'magia', args: {} } }); }],
  ['EFECTOS desactualizado', (e, t, d, ME) => { ME.EFECTOS_OPTATIVAS.pop(); }],
  ['un raro sin texto', (e) => { e['vuelta-faro'].pasos.push({ tipo: 'efecto', nombre: 'raro:faro-fantasma' }); }],
  ['un objeto sin texto', (e) => { e['frasco-repisa'].pasos.push({ tipo: 'efecto', nombre: 'objeto:frasco-de-dulce' }); }],
  ['un raro huérfano', (e, t) => { t.raro['suelto'] = { titulo: 'Suelto', texto: 'Esto no lo anota ninguna escena.', cap: 3, donde: 'valle' }; }],
  ['un raro de otro capítulo', (e, t) => { t.raro['ovejas-juntas'].cap = 8; }],
  ['un raro que choca con los actos', (e, t) => { t.raro['chocolate'] = { ...t.raro['la-porfiada'] }; e['oveja-ramon'].pasos.push({ tipo: 'efecto', nombre: 'raro:chocolate' }); }],
  ['el tablón sin una optativa', (e, t) => { delete t.tablon['noventa']; }],
  ['el tablón con una optativa inventada', (e, t) => { t.tablon['inventada'] = { ...t.tablon['oveja'] }; }],
  ['el tablón con el capítulo mal', (e, t) => { t.tablon['papel-elsa'].caps = [10]; }],
  ['el tablón sin línea de hecha', (e, t) => { delete t.tablon['mulas'].hecha; }],
  ['una optativa sin charla de después', (e, t) => { t.charla.sofia = []; }],
  ['charla que mira una escena inexistente', (e, t) => { t.charla.rosa[0].cuando = { escena: 'frasco-azul' }; }],
  ['charla que mira la optativa teniendo escena', (e, t) => { t.charla.ramon[0].cuando = { optativa: 'oveja' }; }],
  ['charla antes de su escena', (e, t) => { t.charla.ramon.find((x) => x.id === 'ramon-opt-ovejas').cap = 8; }],
  ['charla con id repetido de un acto', (e, t) => { t.charla.rosa[0].id = 'rosa-c2-frasco'; }],
  ['falta la tabla de disparo', (e, t, d) => { delete d['oveja-ramon']; }],
  ['disparo con otro capítulo', (e, t, d) => { d['vuelta-faro'].cap = 5; }],
  ['disparo con una optativa de otro capítulo', (e, t, d) => { d['pan-fermin'].objetivo = 'noventa'; }],
  ['disparo que dice que la ofrece quien no la ofrece', (e, t, d) => { d['vuelta-faro'].ofrece = 'anden-graciela'; }],
  ['frasco-rosa sin el pan de tres mañanas', (e) => { e['frasco-rosa'].pasos.find((p) => p.nombre === 'mundo:pan-de-rosa').args.dias = 1; }],
  ['frasco-rosa con pan duplicado', (e, t, d, ME) => { e['frasco-rosa'].pasos.push({ tipo: 'efecto', nombre: 'dar:pan-casero:1' }); ME.EFECTOS_OPTATIVAS.push('dar:pan-casero:1'); ME.EFECTOS_OPTATIVAS.sort(); }],
  ['oveja-ramon sin la variante del perro', (e) => { const p = e['oveja-ramon'].pasos.find((q) => q.si?.cond === 'evento' && !q.si.no && q.tipo === 'dialogo' && q.quien === 'ramon'); delete p.si; }],
  ['pan-fermin gasta las dos cosas', (e) => { elec(e['pan-fermin'], 'fermin-pan-que').opciones[1].efecto = 'quitar:pan-casero:1'; }],
  ['vuelta-faro da lazo', (e, t, d, ME) => { e['vuelta-faro'].pasos.push({ tipo: 'efecto', nombre: 'lazo:graciela:2' }); ME.EFECTOS_OPTATIVAS.push('lazo:graciela:2'); ME.EFECTOS_OPTATIVAS.sort(); }],
  ['juntar-ovejas con Fermín siempre', (e) => { for (const p of e['juntar-ovejas'].pasos) if (p.si?.cond === 'decision' && p.si.args.es === 'a') delete p.si; }],
  ['juntar-ovejas sin cerrar el corral', (e, t, d, ME) => { e['juntar-ovejas'].pasos = e['juntar-ovejas'].pasos.filter((p) => p.nombre !== 'mundo:ovejas-juntas'); }],
];
let atrapadas = 0;
for (const [nombre, tocar] of MUT_DATOS) {
  const r = mutanteDatos(tocar);
  if (r.length) atrapadas++; else console.log('NO ATRAPÓ la mutación de datos: ' + nombre);
  ok(r.length > 0, `atrapa la mutación de datos «${nombre}»`);
}
ok(mutanteDatos(() => {}).length === 0, 'una copia exacta de los datos pasa');

// ---------------------------------------------------------------- MUTACIONES de código: copia mutada en una carpeta temporal, importada con ?v=
const tmp = mkdtempSync(join(tmpdir(), 'hx-opt-'));
const DEPS = ['historia-escenas-util.js', 'historia-escenas-acto2-util.js', 'historia-escenas-acto3-util.js'];
let atrapadasCodigo = 0;
const MUT_CODIGO = [
  ['falta el export DISPARO_OPTATIVAS', 'E', (t) => t.replace('export const DISPARO_OPTATIVAS', 'const DISPARO_OPTATIVAS')],
  ['dos exports en una línea', 'E', (t) => t.replace('export const POR_DEFECTO_OPTATIVAS = {};', 'export const POR_DEFECTO_OPTATIVAS = {}, OTRO_MAS = 1;')],
  ['un export con ñ', 'T', (t) => t.replace('export function tablonDe(', 'export const tablonDeÑ = 1;\nexport function tablonDe(')],
  ['un import partido en dos líneas', 'E', (t) => t.replace("import { FRENTE, con } from './historia-escenas-acto2-util.js';", "import {\n  FRENTE, con } from './historia-escenas-acto2-util.js';")],
  ['fines de línea CRLF', 'T', (t) => t.replace(/\n/g, '\r\n')],
  ['un módulo que toca el DOM', 'T', (t) => t + '\nexport const ancho = () => window.innerWidth;\n'],
  ['un id con ñ', 'E', (t) => t.replace("'vuelta-faro': vueltaFaro,", "'vuelta-faro': vueltaFaro,\n  'ñandu': { ...vueltaFaro, id: 'ñandu' },")],
  ['EFECTOS fijo en vez de calculado', 'E', (t) => t.replace(/export const EFECTOS_OPTATIVAS = .*$/m, "export const EFECTOS_OPTATIVAS = ['raro:la-porfiada'];")],
  ['IDS desordenados', 'E', (t) => t.replace('export const IDS_OPTATIVAS = Object.keys(ESCENAS_OPTATIVAS);', 'export const IDS_OPTATIVAS = Object.keys(ESCENAS_OPTATIVAS).reverse();')],
  ['charla que ignora la escena', 'T', (t) => t.replace('if (w.escena) return tiene(estado.escenas, w.escena);', 'if (w.escena) return true;')],
  ['charla que ignora el capítulo', 'T', (t) => t.replace('if (l.cap > capitulo) return false;', '')],
  ['charla que elige la más vieja', 'T', (t) => t.replace('const tope = Math.max(', 'const tope = Math.min(')],
  ['tablonDe que confunde abierta y hecha', 'T', (t) => t.replace('texto: hecha ? t.hecha : t.ofrecida', 'texto: t.hecha')],
  ['tablonDe sin hasOwn (claves peligrosas)', 'T', (t) => t.replace('const t = Object.hasOwn(TEXTO_OPTATIVAS.tablon, id) ? TEXTO_OPTATIVAS.tablon[id] : null;', 'const t = TEXTO_OPTATIVAS.tablon[id] || null;')],
  ['la variante del perro rota en el código', 'E', (t) => t.replace("const conPerro = { cond: 'evento', args: { id: 'oveja', opcion: 'perro' } };", "const conPerro = { cond: 'evento', args: { id: 'oveja', opcion: 'gato' } };")],
  ['menciona lo que no se menciona', 'E', (t) => t + '\n// scratch\n'],
];
try {
  for (const d of DEPS) copyFileSync(join(raiz, 'src', d), join(tmp, d));
  for (const [i, [nombre, cual, cambiar]] of MUT_CODIGO.entries()) {
    const tE = cual === 'E' ? cambiar(real.textoE) : real.textoE;
    const tT = cual === 'T' ? cambiar(real.textoT) : real.textoT;
    ok(tE !== real.textoE || tT !== real.textoT, `la mutación de código «${nombre}» cambia el archivo`);
    writeFileSync(join(tmp, 'historia-escenas-optativas.js'), tE);
    writeFileSync(join(tmp, 'historia-texto-optativas.js'), tT);
    let r;
    try { const m = await cargar(tmp); r = todo(m.ME, m.MT, m.textoE, m.textoT); } catch (err) { r = ['no carga: ' + err.message]; }
    if (r.length) atrapadasCodigo++; else console.log('NO ATRAPÓ la mutación de código: ' + nombre + ` (${i})`);
    ok(r.length > 0, `atrapa la mutación de código «${nombre}»`);
  }
  // control: la copia sin tocar, importada igual desde la carpeta temporal, pasa
  writeFileSync(join(tmp, 'historia-escenas-optativas.js'), real.textoE);
  writeFileSync(join(tmp, 'historia-texto-optativas.js'), real.textoT);
  const m = await cargar(tmp);
  const r = todo(m.ME, m.MT, m.textoE, m.textoT);
  ok(r.length === 0, 'la copia sin mutar, cargada desde la carpeta temporal, pasa: ' + r.slice(0, 5).join(' | '));
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
ok(atrapadas === MUT_DATOS.length && atrapadasCodigo === MUT_CODIGO.length, `atrapó ${atrapadas}/${MUT_DATOS.length} mutaciones de datos y ${atrapadasCodigo}/${MUT_CODIGO.length} de código`);

console.log(fallas ? `FALLARON ${fallas} de ${n}` : `verificar-4-18-0-escenas-optativas: ${n} comprobaciones OK (${MUT_DATOS.length} mutaciones de datos y ${MUT_CODIGO.length} de código atrapadas)`);
process.exit(fallas ? 1 : 0);
