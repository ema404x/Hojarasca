// 4.18.2 (B): la escena de Sofía y los textos de los lazos de los vecinos (src/historia-escenas-lazos.js y src/historia-texto-lazos.js). Sólo Node.
// La escena se valida con el director real (escenas.js), se corre por TODOS los caminos de elección, se salta, y se revisan los textos (cabe en el
// cuadro, sin inglés, sin religión ni nada explícito, sin números ni la palabra «lazo» a la vista, sin nombrar lo que no existe). Además: cada línea
// de final y de charla pide un lazo que las escenas pueden dar (cota calculada de los datos de las escenas y de los encargos), las frases de los
// vecinos que no pueden quedar tirantes no tienen línea tirante, y los pedidos para A están en CAMBIOS_4_18_2_B.md.
//
// MUTACIONES que miden de verdad: la suite entera (`todo`) recibe los MÓDULOS como parámetro. Las mutaciones de datos clonan lo exportado; las de
// CÓDIGO escriben una copia mutada de los dos archivos en una carpeta temporal (con sus dependencias) y la importan con `?v=<n>`, así cada
// mutante es un módulo nuevo (no el de la caché) y la suite corre sobre él. Cada mutación tiene que hacer fallar algo.
import { readFileSync, existsSync, mkdtempSync, writeFileSync, rmSync, copyFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { ESCENAS_ACTO1 } from '../src/historia-escenas-acto1.js';
import { ESCENAS_ACTO2, DISPARO_ACTO2 } from '../src/historia-escenas-acto2.js';
import { ESCENAS_ACTO3 } from '../src/historia-escenas-acto3.js';
import { ESCENAS_OPTATIVAS } from '../src/historia-escenas-optativas.js';
import { TEXTO_ACTO1 } from '../src/historia-texto-acto1.js';
import { TEXTO_ACTO2 } from '../src/historia-texto-acto2.js';
import { TEXTO_ACTO3 } from '../src/historia-texto-acto3.js';
import { TEXTO_OPTATIVAS } from '../src/historia-texto-optativas.js';
import { efectosDe, condicionesDe, parsearEfecto, LAZOS_SECUNDARIOS } from '../src/historia-escenas-util.js';
import { parsearEfectoActo3, CONDICIONES_ACTO3 } from '../src/historia-escenas-acto3-util.js';
import { crearDirector, validarEscena, PERSONAJES_BASE, POSES_ESCENA } from '../src/escenas.js';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => readFileSync(join(raiz, f), 'utf8');
let n = 0, fallas = 0;
const ok = (c, t) => { n++; if (!c) { fallas++; console.log('FALLA ' + t); } };

const ARCH_ESC = 'src/historia-escenas-lazos.js', ARCH_TEX = 'src/historia-texto-lazos.js';
const VECINOS = ['rosa', 'tito', 'tobias', 'herminia', 'nicanor', 'belisario', 'sofia'];
const PALABRAS = ['conocido', 'de confianza', 'de la casa'];
const NOMBRES_OK = new Set(['Administración', 'Aldea', 'Arroyo', 'Belisario', 'Don', 'Duendes', 'Elsa', 'Ercilia', 'Esquel', 'Estación', 'Eusebio', 'Fermín', 'Graciela', 'Herminia',
  'Josefina', 'Nicanor', 'Nélida', 'Ramal', 'Ramón', 'Refugio', 'Rosa', 'Valle', 'Tito', 'Tobías', 'Sofía', 'Puesto', 'Alto', 'Marta', 'Ahí', 'Ah', 'Mirá', 'Vos', 'Ya', 'Diolch', 'Lo']);
const PERSONAS_REALES = ['Herminia', 'Rosa', 'Nicanor', 'Tito', 'Tobías', 'Belisario', 'Sofía'];
const MAX_LINEA = 260, MAX_OPCION = 96, MAX_PREGUNTA = 72, MAX_PARRAFO = 420;

const pal = (lista) => new RegExp(String.raw`(?<![\p{L}\p{N}])(?:${lista})(?![\p{L}\p{N}])`, 'iu');
const INGLES = pal("the|and|you|your|with|this|that|have|from|they|will|would|there|here|what|when|where|which|are|was|were|not|but|for|into|our|his|her|she|him|its|okay|hello|sorry|please|thanks|yes|don't|can't|it's");
const SAGRADO = pal("dios|diablo|santo|santa|santos|virgen|ángel|ángeles|angeles|cruz|rez\\p{L}*|oración|infierno|demonio\\p{L}*|iglesia|capilla|misa|altar|bautiz\\p{L}*|cristo|jesús|plegaria|bendito|pachamama|gauchito|difunta correa|nguillatún|kalku|machi|bendec\\p{L}*|bendic\\p{L}*|sagrad\\p{L}*|ofrenda\\p{L}*|milagro\\p{L}*|cielo santo|pecado\\p{L}*|tumba|funeral\\p{L}*|velorio|rito|ritual\\p{L}*");
const EXPLICITO = pal("sexo|sexual\\p{L}*|desnud\\p{L}*|tetas?|pene|verga|coger|cogiendo|culo|orgasm\\p{L}*|erótic\\p{L}*|follar|concha|puta\\p{L}*|mierda|carajo|boludo\\p{L}*|pija|cama|camas|bes[oa]\\p{L}*|sábanas|abraz\\p{L}*|amantes?");
const INEXISTENTE = pal("hospedaje|hotel|posada|hostal|pensión|escuela de música|farmacia|banco de la aldea");
// lo que no puede verse en pantalla: números de lazo ni la palabra «lazo»
const NUMEROS = /\d|\blazos?\b|\bpuntos? de\b/i;

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
const ESCENAS_PREVIAS = { ...ESCENAS_ACTO1, ...ESCENAS_ACTO2, ...ESCENAS_ACTO3, ...ESCENAS_OPTATIVAS };
const TEXTOS_PREVIOS = [TEXTO_ACTO1, TEXTO_ACTO2, TEXTO_ACTO3, TEXTO_OPTATIVAS];
const ELECCIONES_PREVIAS = new Set(Object.values(ESCENAS_PREVIAS).flatMap((e) => e.pasos.filter((p) => p.tipo === 'eleccion').map((p) => p.id)));
const CHARLA_PREVIA = TEXTOS_PREVIOS.flatMap((T) => Object.values(T.charla || {}).flat());
const RARO_PREVIO = Object.assign({}, ...TEXTOS_PREVIOS.map((T) => T.raro || {}));
const ENCARGOS = leer('src/encargos.js') + leer('src/encargos-temporada.js');
const actoDeCap = (c) => (c <= 4 ? 1 : c <= 8 ? 2 : 3);

// La cota de lo que cada vecino puede sumar: por cada escena, lo máximo que da por un solo camino de elecciones (sin mirar las decisiones: es una
// cota de arriba), más los encargos que le piden. Si una línea pide más que la cota, ninguna partida la ve nunca.
function sumasDeEscena(e, nuevasPorQuien = null) {
  const elecs = e.pasos.filter((p) => p.tipo === 'eleccion');
  const mejor = {}, peor = {};
  const rec = (i, asig) => {
    if (i === elecs.length) {
      const suma = {};
      const sumar = (nombre) => { const p = parsearEfecto(nombre); if (p?.tipo === 'lazo') suma[p.quien] = (suma[p.quien] || 0) + p.n; };
      for (const p of e.pasos) {
        if (p.tipo === 'efecto' && (!p.si || !p.si.eleccion || asig[p.si.eleccion] === p.si.es)) sumar(p.nombre);
        if (p.tipo === 'eleccion') { const o = p.opciones.find((x) => x.id === asig[p.id]); if (o?.efecto) sumar(o.efecto); }
      }
      for (const [q, v] of Object.entries(suma)) { mejor[q] = Math.max(mejor[q] ?? -99, v); peor[q] = Math.min(peor[q] ?? 99, v); }
      return;
    }
    for (const o of elecs[i].opciones) rec(i + 1, { ...asig, [elecs[i].id]: o.id });
  };
  rec(0, {});
  return { mejor, peor };
}
function cotas(escenasNuevas) {
  const arriba = {}, abajo = {}, primera = {}, primeraNeg = {};
  for (const e of [...Object.values(ESCENAS_PREVIAS), ...Object.values(escenasNuevas)]) {
    const { mejor, peor } = sumasDeEscena(e);
    for (const [q, v] of Object.entries(mejor)) if (v > 0) { arriba[q] = (arriba[q] || 0) + v; primera[q] = Math.min(primera[q] ?? 99, e.capitulo); }
    for (const [q, v] of Object.entries(peor)) if (v < 0) { abajo[q] = (abajo[q] || 0) + v; primeraNeg[q] = Math.min(primeraNeg[q] ?? 99, e.capitulo); }
  }
  for (const q of VECINOS) { const k = [...ENCARGOS.matchAll(new RegExp(`quien: '${q}'`, 'g'))].length; if (k) arriba[q] = (arriba[q] || 0) + k; }
  return { arriba, abajo, primera, primeraNeg };
}

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
  else if (obj && typeof obj === 'object') for (const [k, v] of Object.entries(obj)) { if (['id', 'quien', 'escena', 'donde', 'rol'].includes(k) && typeof v === 'string') continue; textosPlanos(v, acc); }
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
    actores, hv: 14, sonidos: [], empezo: 0, termino: 0, horas: [],
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
    horaActual: () => w.hv, hora(h) { w.hv = h; w.horas.push(h); }, clima() {}, sonido(id) { w.sonidos.push(id); },
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
function correrEscena(escena, efectosLista, { script = [], decisiones = {}, saltarAl = -1 } = {}) {
  const mundo = mundoFalso();
  const est = { vistas: {}, elecciones: {} };
  const corridos = [], resultados = [];
  const efectos = {};
  for (const nombre of efectosLista) efectos[nombre] = (args, ctx) => { corridos.push({ nombre, args, saltando: ctx.saltando }); };
  const condiciones = { decision: (c) => (decisiones[c.args.d] ?? 'ninguna') === c.args.es };
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
      const idx = k < script.length ? script[k] : null;
      const tomada = idx === null ? d.eleccion.porDefecto ?? 0 : idx;
      log.elecciones.push({ id: d.eleccion.id, n: d.eleccion.opciones.length, tomada });
      k++;
      dir.elegir(tomada);
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
  const ESC = ME.ESCENAS_LAZOS || {}, DIS = ME.DISPARO_LAZOS || {}, EFS = ME.EFECTOS_LAZOS || [];
  const TEX = MT.TEXTO_LAZOS || {};
  const ids = Object.keys(ESC), escenas = Object.values(ESC);
  const E = ESC['foto-valle'] || { id: 'foto-valle', pasos: [], capitulo: 7 };

  // 0) los exports que el que junta espera
  c(Array.isArray(ME.IDS_LAZOS) && ME.IDS_LAZOS.join() === ids.join(), 'IDS_LAZOS no son los ids de ESCENAS_LAZOS');
  c(ME.POR_DEFECTO_LAZOS && typeof ME.POR_DEFECTO_LAZOS === 'object' && !Array.isArray(ME.POR_DEFECTO_LAZOS), 'falta POR_DEFECTO_LAZOS');
  c(typeof MT.lazoCumple === 'function' && typeof MT.finalDeLazos === 'function' && typeof MT.fraseDeGuia === 'function', 'faltan lazoCumple, finalDeLazos o fraseDeGuia');
  c(Array.isArray(MT.VECINOS_LAZO) && MT.VECINOS_LAZO.join() === VECINOS.join(), 'VECINOS_LAZO no son los siete en el orden del final');
  c(VECINOS.every((q) => q === 'sofia' || LAZOS_SECUNDARIOS.includes(q)) && LAZOS_SECUNDARIOS.includes('sofia'), 'historia-escenas-util.js: LAZOS_SECUNDARIOS tiene que incluir a los siete (con sofia)');

  // 1) ids exactos, sin chocar con nada
  c(ids.join() === 'foto-valle', 'la única escena es foto-valle: ' + ids.join(','));
  c(Object.entries(ESC).every(([k, e]) => e && e.id === k), 'el id de cada escena coincide con su clave');
  c(ids.every((id) => !Object.hasOwn(ESCENAS_PREVIAS, id)), 'un id de escena choca con los actos o las optativas');
  c(ids.every((id) => /^[a-z0-9][a-z0-9-]*$/.test(id)), 'ids de escena sólo con minúsculas sin ñ, números y guiones');

  // 2) válida, con resumen, en su acto y capítulo
  for (const e of escenas) {
    const v = validarEscena(e);
    c(v.ok, `${e?.id}: no valida (${(v.errores || []).join('; ')})`);
    c(typeof e.resumen === 'string' && e.resumen.length > 20 && typeof e.titulo === 'string' && e.titulo.length > 2, `${e?.id}: sin resumen o título`);
    c(e.capitulo >= 1 && e.capitulo <= 13 && e.acto === actoDeCap(e.capitulo), `${e?.id}: acto ${e?.acto} y capítulo ${e?.capitulo} no coinciden`);
    c(!e.efimera, `${e?.id}: no puede ser efímera`);
    c(e.pasos.filter((p) => p.tipo === 'plano').length >= 4, `${e.id}: menos de cuatro planos de cámara`);
    c(e.pasos.some((p) => p.tipo === 'dialogo') && e.pasos.some((p) => p.tipo === 'fundido'), `${e.id}: sin diálogo o sin los fundidos del paso de la hora`);
  }

  // 3) efectos y condiciones: la convención. Esta escena sólo mueve a Sofía (los seis de antes y los otros siete no) y no da objetos ni plata
  const usados = new Set(escenas.flatMap((e) => efectosDe(e)));
  for (const e of escenas) {
    for (const nombre of efectosDe(e)) {
      c(parsearEfectoActo3(nombre), `${e.id}: el efecto «${nombre}» no sigue la convención`);
      c(/^(?:lazo:sofia:[12]|raro:foto-del-valle)$/.test(nombre), `${e.id}: el efecto «${nombre}» no es de los permitidos (sólo Sofía y su raro: sin premios nuevos)`);
    }
    for (const cond of condicionesDe(e)) c(CONDICIONES_ACTO3.includes(cond), `${e.id}: la condición «${cond}» no está en la convención`);
    const elecs = new Set(e.pasos.filter((p) => p.tipo === 'eleccion').map((p) => p.id));
    for (const p of e.pasos) if (p.si && typeof p.si.eleccion === 'string') c(elecs.has(p.si.eleccion), `${e.id}: mira la elección «${p.si.eleccion}», que no existe`);
    for (const p of e.pasos.filter((q) => q.tipo === 'dialogo')) for (const l of p.lineas || []) c(typeof l === 'string' || (l && typeof l.texto === 'string'), `${e.id}: una línea de diálogo no es texto`);
  }
  c([...usados].every((x) => EFS.includes(x)) && EFS.every((x) => usados.has(x)), 'EFECTOS_LAZOS no es exactamente lo que usan las escenas');
  c(usados.has('lazo:sofia:2') && usados.has('lazo:sofia:1') && usados.has('raro:foto-del-valle'), 'la escena de Sofía da lazo (1 y 2) y anota lo raro');

  // 4) las elecciones: ids únicos, una sola con peso (la de la luz), y por cada camino Sofía suma 1 o 2, nunca los dos
  let conEfecto = 0, total = 0;
  for (const e of escenas) for (const p of e.pasos.filter((q) => q.tipo === 'eleccion')) {
    total++;
    c(!ELECCIONES_PREVIAS.has(p.id), `${e.id}/${p.id}: id de elección repetido con los actos`);
    c(p.opciones.length >= 2 && p.opciones.length <= 3, `${e.id}/${p.id}: de 2 a 3 opciones`);
    c(Number.isInteger(p.porDefecto) && p.porDefecto >= 0 && p.porDefecto < p.opciones.length, `${e.id}/${p.id}: porDefecto inválido`);
    c((p.pregunta || '').length > 3 && p.pregunta.length <= MAX_PREGUNTA, `${e.id}/${p.id}: pregunta ausente o larga`);
    const pesos = p.opciones.filter((o) => o.efecto).length;
    c(pesos === 0 || pesos === p.opciones.length, `${e.id}/${p.id}: o todas las opciones pesan o ninguna`);
    for (const o of p.opciones) {
      c(!!o.efecto !== (o.sabor === true), `${e.id}/${p.id}/${o.id}: la opción tiene que tener efecto o ser de sabor (y no las dos)`);
      c(typeof o.texto === 'string' && o.texto.length <= MAX_OPCION, `${e.id}/${p.id}/${o.id}: opción demasiado larga`);
    }
    if (pesos) conEfecto++;
  }
  c(total === 3 && conEfecto === 1, `la escena tiene tres elecciones y una sola con peso (${total}, ${conEfecto})`);
  const luz = E.pasos.find((p) => p.tipo === 'eleccion' && p.id === 'valle-luz');
  c(luz && luz.opciones.find((o) => o.id === 'esperar')?.efecto === 'lazo:sofia:2' && luz.opciones.find((o) => o.id === 'apurar')?.efecto === 'lazo:sofia:1' && luz.opciones.find((o) => o.id === 'mover')?.efecto === 'lazo:sofia:1', 'valle-luz: esperar la luz da +2; apurar o moverte, +1');
  c(luz && luz.opciones[luz.porDefecto]?.id === 'apurar', 'valle-luz: si se saltea vale la opción prudente (apurar: +1)');

  // 5) hablantes, claves, poses, lugares
  for (const e of escenas) {
    const decl = { ...PERSONAJES_BASE, ...(e.personajes || {}) };
    for (const q of hablantesUsados(e)) c(q && Object.hasOwn(decl, q), `${e.id}: hablante o actor sin declarar «${q}»`);
    for (const [k, pjx] of Object.entries(e.personajes || {})) {
      if (pjx.clave) c(CLAVES.has(pjx.clave), `${e.id}: «${k}» usa la clave «${pjx.clave}» que no existe`);
      c(typeof pjx.nombre === 'string' && /^#[0-9a-f]{6}$/i.test(pjx.color || ''), `${e.id}: personaje «${k}» sin nombre o color`);
    }
    c(e.personajes?.sofia?.clave === 'fotografa', `${e.id}: Sofía es la clave del juego «fotografa»`);
    for (const p of e.pasos) if (p.tipo === 'gesto' && p.accion === 'posar') c(POSES_ESCENA.includes(p.pose), `${e.id}: pose «${p.pose}» desconocida`);
    for (const l of e.pasos.filter((p) => p.tipo === 'dialogo').flatMap((p) => p.lineas)) if (l && l.gesto) c(POSES_ESCENA.includes(l.gesto.pose), `${e.id}: pose de línea «${l.gesto.pose}» desconocida`);
    for (const l of lugaresUsados(e)) c(LUGARES.has(l), `${e.id}: el lugar «${l}» no existe`);
  }

  // 6) los textos: castellano, nada religioso ni explícito, sin números de lazo a la vista
  const revisar = (t, donde) => {
    c(!INGLES.test(t), `${donde}: inglés en «${t.slice(0, 50)}»`);
    c(!SAGRADO.test(t), `${donde}: palabra religiosa en «${t.slice(0, 50)}»`);
    c(!EXPLICITO.test(t), `${donde}: palabra explícita en «${t.slice(0, 50)}»`);
    c(!INEXISTENTE.test(t), `${donde}: nombra algo que no existe en «${t.slice(0, 50)}»`);
    c(!NUMEROS.test(t), `${donde}: números o la palabra «lazo» a la vista en «${t.slice(0, 50)}»`);
    for (const m of t.matchAll(/(?<=[a-záéíóúñ,;:] )([A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,})/g)) c(NOMBRES_OK.has(m[1]), `${donde}: nombre propio que no existe «${m[1]}»`);
  };
  for (const e of escenas) {
    for (const l of lineasDeDialogo(e)) c(typeof l === 'string' && l.trim().length > 0 && l.length <= MAX_LINEA, `${e.id}: línea vacía o larga`);
    for (const t of textosDe(e)) revisar(t, e.id);
  }
  for (const t of textosPlanos(TEX)) { revisar(t, 'texto'); c(t.length <= MAX_PARRAFO, `texto: párrafo largo «${t.slice(0, 40)}»`); }
  for (const p of PERSONAS_REALES) c(TEXTO_JUEGO.includes(p), `la persona «${p}» no está en el juego`);

  // 7) el cuaderno de lo raro: el de la escena, en su capítulo, sin chocar
  const raros = TEX.raro || {};
  c(Object.keys(raros).join() === 'foto-del-valle', 'raro: sólo «foto-del-valle»');
  for (const [id, r] of Object.entries(raros)) {
    c(parsearEfectoActo3(`raro:${id}`) && !Object.hasOwn(RARO_PREVIO, id), `raro «${id}»: fuera de la convención o repetido con los actos`);
    c(r && typeof r.texto === 'string' && r.texto.length > 15 && typeof r.titulo === 'string' && r.cap === E.capitulo && typeof r.donde === 'string', `raro «${id}»: incompleto o de otro capítulo`);
    c(usados.has(`raro:${id}`), `raro «${id}»: ninguna escena lo anota`);
  }

  // 8) el tablón de la optativa nueva
  const tab = TEX.tablon || {};
  c(Object.keys(tab).join() === 'foto-valle', 'tablón: sólo la optativa «foto-valle»');
  const t = tab['foto-valle'];
  c(!!t && Array.isArray(t.caps) && t.caps.includes(E.capitulo) && t.caps.every((x, i, a) => Number.isInteger(x) && (i === 0 || x === a[i - 1] + 1)) && t.quien === 'sofia', 'tablón «foto-valle»: capítulos seguidos que incluyen el de la escena, de Sofía');
  c(!!t && typeof t.titulo === 'string' && t.titulo.length > 3 && typeof t.ofrecida === 'string' && t.ofrecida.length > 20 && typeof t.hecha === 'string' && t.hecha.length > 15 && t.ofrecida !== t.hecha, 'tablón «foto-valle»: incompleto');
  c(Object.hasOwn(TEXTO_OPTATIVAS.tablon, 'foto-sofia') && !Object.hasOwn(TEXTO_OPTATIVAS.tablon, 'foto-valle'), 'tablón: «foto-sofia» sigue en el de las optativas y «foto-valle» sólo en el de los lazos');

  // 9) la tabla de disparo
  for (const id of ids) {
    const d = DIS[id];
    c(!!d && typeof d.jugadorEn === 'string' && typeof d.cuando === 'string' && d.cap === ESC[id].capitulo, `${id}: sin disparo o con otro capítulo`);
    if (d) c(d.objetivo === 'foto-valle' && d.objetivo in tab && d.ofrece === null, `${id}: la optativa que cuenta es la del tablón y la ofrece el registro`);
  }
  c(Object.keys(DIS).every((id) => Object.hasOwn(ESC, id)), 'la tabla de disparo tiene escenas de más');

  // 10) la guía: nombre, rol y una frase corta por palabra del lazo; sólo Tito tiene la tirante
  const guia = TEX.guia || {};
  c(VECINOS.every((q) => Object.hasOwn(guia, q)) && Object.keys(guia).length === 7, 'guía: los siete vecinos, ni uno más');
  for (const q of VECINOS) {
    const g = guia[q];
    c(!!g && typeof g.nombre === 'string' && g.nombre.length >= 3 && typeof g.rol === 'string' && g.rol.length >= 5, `guía «${q}»: sin nombre o rol`);
    for (const p of PALABRAS) c(typeof g?.frases?.[p] === 'string' && g.frases[p].length >= 15 && g.frases[p].length <= 90, `guía «${q}»: falta la frase de «${p}» o es muy larga`);
    c(Object.keys(g?.frases || {}).every((p) => [...PALABRAS, 'tirante'].includes(p)), `guía «${q}»: una palabra de lazo desconocida`);
    c(q === 'tito' ? typeof g?.frases?.tirante === 'string' : !Object.hasOwn(g?.frases || {}, 'tirante'), `guía «${q}»: la frase tirante es sólo de Tito`);
  }
  c(MT.fraseDeGuia?.('tito', 'tirante') === guia.tito?.frases?.tirante && MT.fraseDeGuia?.('rosa', 'tirante') === null && MT.fraseDeGuia?.('rosa', 'frío') === null && MT.fraseDeGuia?.('constructor', 'conocido') === null && MT.fraseDeGuia?.('rosa', 'constructor') === null && MT.fraseDeGuia?.('rosa', 'conocido') === guia.rosa?.frases?.conocido, 'fraseDeGuia: la frase de ese vecino y esa palabra, o null (ni claves peligrosas)');

  // 11) el final: una línea por vecino con lazo alto, y la tirante sólo de Tito. Cada línea pide un lazo que las escenas pueden dar
  const cota = cotas(ESC);
  const fin = TEX.final || {};
  const idsFinal = [];
  c(VECINOS.every((q) => Object.hasOwn(fin, q) && Array.isArray(fin[q]) && fin[q].length >= 1) && Object.keys(fin).length === 7, 'final: una lista por cada uno de los siete');
  for (const q of VECINOS) for (const l of fin[q] || []) {
    idsFinal.push(l.id);
    c(typeof l.texto === 'string' && l.texto.length >= 40 && l.texto.length <= MAX_LINEA && typeof l.id === 'string', `final ${l.id}: texto corto o largo`);
    c((l.min === undefined) !== (l.max === undefined), `final ${l.id}: tiene que pedir un mínimo o un máximo (uno solo)`);
    if (l.min !== undefined) c(Number.isInteger(l.min) && l.min >= 1 && l.min <= 3 && l.min <= (cota.arriba[q] || 0), `final ${l.id}: pide un lazo (${l.min}) que las escenas no dan (cota ${cota.arriba[q] || 0})`);
    if (l.max !== undefined) c(Number.isInteger(l.max) && l.max === -1 && q === 'tito' && (cota.abajo[q] || 0) <= -1, `final ${l.id}: la línea tirante es sólo de Tito (el único que las escenas dejan en −1)`);
  }
  c(new Set(idsFinal).size === idsFinal.length, 'final: ids repetidos');
  c(['rosa', 'tobias', 'herminia', 'nicanor'].every((q) => fin[q]?.[0]?.min === 3) && fin.tito?.[0]?.min === 3 && fin.belisario?.[0]?.min === 2 && fin.sofia?.[0]?.min === 2, 'final: de la casa (3) para Rosa, Tito, Tobías, Herminia y Nicanor; Belisario y Sofía 2 (hasta donde llegan las escenas)');
  c(VECINOS.every((q) => (fin[q] || []).filter((l) => l.min !== undefined).length === 1) && (fin.tito || []).filter((l) => l.max !== undefined).length === 1 && VECINOS.filter((q) => q !== 'tito').every((q) => (fin[q] || []).every((l) => l.max === undefined)), 'final: una línea alta por vecino y una sola tirante (Tito)');
  if (typeof MT.finalDeLazos === 'function') {
    const L = (o) => (q) => o[q] ?? 0;
    const ft = (o) => MT.finalDeLazos(L(o));
    const txt = (q, i = 0) => fin[q]?.[i]?.texto;
    c(ft({}).length === 0 && ft({ rosa: 2, tobias: 2, tito: 0, sofia: 1, belisario: 1 }).length === 0, 'finalDeLazos: con lazos bajos o conocidos no sale nada');
    c(ft({ rosa: 3 }).join() === txt('rosa') && ft({ rosa: 3, tito: 3 }).join('|') === [txt('rosa'), txt('tito')].join('|'), 'finalDeLazos: el de la casa de Rosa, y el de Tito después');
    c(ft({ tito: -1 }).join() === txt('tito', 1) && ft({ tito: -2 }).join() === txt('tito', 1) && ft({ tito: 0 }).length === 0 && ft({ tito: 3 }).join() === txt('tito', 0), 'finalDeLazos: Tito tirante con lazo −1 o menos, nada con 0, el alto con 3');
    c(ft({ belisario: 2 }).join() === txt('belisario') && ft({ sofia: 2 }).join() === txt('sofia') && ft({ sofia: 3 }).join() === txt('sofia') && ft({ belisario: 1 }).length === 0 && ft({ sofia: 1 }).length === 0, 'finalDeLazos: Belisario y Sofía con 2 o más');
    const todos = ft({ rosa: 3, tito: 3, tobias: 3, herminia: 3, nicanor: 3, belisario: 3, sofia: 3 });
    c(todos.length === 7 && todos.join('|') === VECINOS.map((q) => txt(q)).join('|'), 'finalDeLazos: los siete, en el orden fijo');
    c(MT.finalDeLazos().length === 0 && MT.finalDeLazos(null).length === 0 && MT.finalDeLazos(() => NaN).length === 0, 'finalDeLazos: sin función o con basura no rompe ni inventa');
  }

  // 12) la charla: la del lazo alto de cada vecino, la tirante de Tito y la de después de la escena de Sofía
  const ch = TEX.charlas || {};
  const lineas = Object.entries(ch).flatMap(([q, l]) => (Array.isArray(l) ? l.map((x) => ({ ...x, quien: q })) : []));
  const idsCh = lineas.map((x) => x.id);
  c(new Set(idsCh).size === idsCh.length && idsCh.every((id) => !CHARLA_PREVIA.some((x) => x.id === id) && !idsFinal.includes(id)), 'charlas: ids repetidos (entre sí, con el final o con los actos)');
  c(Object.keys(ch).length === 7 && VECINOS.every((q) => Object.hasOwn(ch, q)), 'charlas: los siete vecinos');
  const todasEscenas = { ...ESCENAS_PREVIAS, ...ESC };
  const textosPrevios = lineas.map((x) => x.texto);
  for (const x of lineas) {
    c(typeof x.texto === 'string' && x.texto.length > 40 && x.texto.length <= MAX_LINEA && x.cap >= 1 && x.cap <= 13, `charla ${x.id}: inválida`);
    const w = x.cuando || {};
    c(!!w.lazo !== !!w.escena && Object.keys(w).length === 1, `charla ${x.id}: tiene que mirar el lazo o una escena (sólo una)`);
    if (w.escena) c(Object.hasOwn(todasEscenas, w.escena) && todasEscenas[w.escena].capitulo <= x.cap, `charla ${x.id}: la escena «${w.escena}» no existe o es de un capítulo posterior`);
    if (w.lazo) {
      const r = w.lazo;
      c((r.min === undefined) !== (r.max === undefined) && Object.keys(r).length === 1, `charla ${x.id}: el lazo pide un mínimo o un máximo (uno solo)`);
      if (r.min !== undefined) c(Number.isInteger(r.min) && r.min >= 1 && r.min <= 3 && r.min <= (cota.arriba[x.quien] || 0), `charla ${x.id}: pide un lazo (${r.min}) que las escenas no dan (cota ${cota.arriba[x.quien] || 0})`);
      if (r.min !== undefined) c(x.cap >= (cota.primera[x.quien] ?? 99) || x.quien === 'nicanor', `charla ${x.id}: sale antes de que ninguna escena dé lazo a ${x.quien}`);
      if (r.max !== undefined) c(r.max === -1 && x.quien === 'tito' && x.cap >= (cota.primeraNeg.tito ?? 99), `charla ${x.id}: la tirante es sólo de Tito, y no antes de la escena que lo deja así`);
    }
  }
  c(VECINOS.every((q) => (ch[q] || []).filter((l) => l.cuando?.lazo?.min !== undefined).length === 1), 'charlas: una línea de lazo alto por vecino');
  c((ch.tito || []).filter((l) => l.cuando?.lazo?.max !== undefined).length === 1 && VECINOS.filter((q) => q !== 'tito').every((q) => (ch[q] || []).every((l) => l.cuando?.lazo?.max === undefined)), 'charlas: una sola tirante (Tito)');
  c((ch.sofia || []).filter((l) => l.cuando?.escena === 'foto-valle').length === 1, 'charlas: Sofía tiene su línea de después de «La luz de las cinco»');
  c(new Set(textosPrevios).size === textosPrevios.length && lineas.every((x) => !CHARLA_PREVIA.some((y) => y.texto === x.texto)), 'charlas: texto repetido');
  if (typeof MT.lazoCumple === 'function') {
    const k = MT.lazoCumple;
    c(k({ min: 2 }, 2) && k({ min: 2 }, 3) && !k({ min: 2 }, 1) && k({ max: -1 }, -1) && k({ max: -1 }, -2) && !k({ max: -1 }, 0) && k({}, 0) && k(null, 0) && k({ min: null, max: null }, -2), 'lazoCumple: mínimo y máximo (inclusivos), sin tope de un lado, y sin rango vale siempre');
    c(!k({ min: 1 }, undefined) && !k({ min: 1 }, 'x') && k({ min: 0 }, 0) && k({ min: 2 }, 2.9) === true && !k({ min: 3 }, 2.9) && k({ min: 0 }, -0.5) && k({}, undefined) && k({ max: 0 }, NaN), 'lazoCumple: el lazo se toma entero y la basura vale 0');
  }

  // 13) la escena corre por todos los caminos, se salta y deja el lazo que corresponde
  for (const [id, e] of Object.entries(ESC)) {
    for (const { script, r } of caminos(e, EFS)) {
      const rot = `${id} [${script.join(',')}]`;
      c(!r.falloRegistro && !r.noDisparo && r.faltan?.length === 0, `${rot}: registra, dispara y tiene sus efectos`);
      c(!r.activa && r.resultados.length === 1 && r.resultados[0].errores.length === 0, `${rot}: termina sin errores (${r.resultados[0]?.errores?.join('; ')})`);
      c(r.dir.vista(id) && r.mundo.empezo === 1 && r.mundo.termino === 1, `${rot}: queda vista, empieza y termina una vez`);
      c(Object.values(r.mundo.actores).every((a) => !a.capt), `${rot}: suelta a todos`);
      c(r.camaras > 5 && r.lineas.length >= 6, `${rot}: cámara y líneas`);
      const lazos = r.corridos.filter((x) => x.nombre.startsWith('lazo:')).map((x) => x.nombre);
      c(lazos.length === 1 && /^lazo:sofia:[12]$/.test(lazos[0]), `${rot}: Sofía suma una sola vez (+1 o +2): ${lazos.join(',')}`);
      c(r.corridos.some((x) => x.nombre === 'raro:foto-del-valle'), `${rot}: anota lo raro`);
      c(r.mundo.horas.length === 2 && r.mundo.horas[0] >= 16.5 && r.mundo.horas[0] <= 17 && r.mundo.horas[1] > r.mundo.horas[0] && r.mundo.horas[1] <= 19, `${rot}: la luz de las cinco y la hora del revelado (${r.mundo.horas.join(',')})`);
    }
    for (const cuando of [2, 40, 300, 1500]) {
      const r = correrEscena(e, EFS, { saltarAl: cuando });
      c(!r.activa && r.dir.vista(id) && r.resultados.length === 1 && r.resultados[0].errores.length === 0, `${id}: se salta a los ${cuando} cuadros`);
    }
  }

  // 14) lo que la escena tiene que hacer (el guion de Sofía)
  const corre = (o = {}) => correrEscena(E, EFS, o);
  const nombres = (r) => (r.corridos || []).map((x) => x.nombre);
  const dice = (o, re) => (corre(o).lineas || []).some((l) => re.test(l));
  {
    const esperar = corre({ script: [0, 0, 0] }), apurar = corre({ script: [0, 1, 0] }), mover = corre({ script: [0, 2, 0] });
    c(nombres(esperar).includes('lazo:sofia:2') && !nombres(esperar).includes('lazo:sofia:1'), 'esperar la luz: Sofía +2 (y no +1)');
    c(nombres(apurar).includes('lazo:sofia:1') && !nombres(apurar).includes('lazo:sofia:2'), 'apurar la luz: Sofía +1 (y no +2)');
    c(nombres(mover).includes('lazo:sofia:1') && !nombres(mover).includes('lazo:sofia:2'), 'moverse: Sofía +1 (y no +2)');
    c(esperar.lineas.some((l) => /No respires/.test(l)) && apurar.lineas.some((l) => /tibia/.test(l)) && mover.lineas.some((l) => /borrón/.test(l)), 'cada manera de pasar la luz tiene su respuesta de Sofía');
    const salteada = corre({ saltarAl: 3 });
    c(nombres(salteada).includes('lazo:sofia:1') && !nombres(salteada).includes('lazo:sofia:2') && nombres(salteada).includes('raro:foto-del-valle'), 'saltarla igual da +1 y anota lo raro');
    c(dice({}, /dos puntitos verdes/) && dice({}, /Es el vidrio/) && dice({}, /Mirá el tamaño/) && dice({}, /para el que venga después/) === false, 'la foto sale con el tamaño y los puntitos verdes, y la respuesta de «por qué de espaldas» sólo si la elegís');
    c(dice({ script: [0, 0, 2] }, /para el que venga después/) && dice({ script: [0, 0, 1] }, /trato sin testigos/) && dice({ script: [0, 0, 0] }, /entre tus cosas raras/), 'las tres respuestas de la copia');
    c(esperar.hablantes.filter((q) => q === 'sofia').length >= 6 && esperar.hablantes.every((q) => q === 'sofia' || q === 'narra'), 'sólo hablan Sofía y la narración');
  }

  // 15) el código: reglas del empaquetador (armar.mjs) y de módulo puro
  for (const [a, tx] of [[ARCH_ESC, textoE], [ARCH_TEX, textoT]]) {
    for (const m of tx.matchAll(/^export\s+(?:const|let|var|function|class)\s+([^\s=(]+)/gm)) c(/^[A-Za-z0-9_$]+$/.test(m[1]), `${a}: el export «${m[1]}» tiene caracteres raros`);
    c(!/^export\s*\{/m.test(tx) && !/^export\s+(?:async|\*|default)/m.test(tx), `${a}: sólo exports que entiende armar.mjs`);
    c(!tx.split('\n').some(dosExports), `${a}: un export const por línea`);
    for (const m of tx.matchAll(/^import\s.*$/gm)) c(/^import\s+\{[^}]+\}\s+from\s+'\.\/[a-z0-9-]+\.js';$/.test(m[0]), `${a}: import en una sola línea`);
    c(!tx.includes('\r'), `${a}: fines de línea LF`);
    c(!/\b(three|THREE|document|window)\b/.test(tx.replace(/\/\/.*$/gm, '')), `${a}: puro (sin three ni DOM)`);
    c(!/scratch/i.test(tx), `${a}: no menciona lo que no se menciona`);
    c(!/ñ/.test(tx.replace(/\/\/.*$/gm, '').replace(/'(?:[^'\\\n]|\\.)*'|"[^"\n]*"|`[^`\n]*`/g, '')), `${a}: una ñ fuera de los textos (ids y nombres sin ñ)`);
  }
  c(!/^import\s/m.test(textoT), `${ARCH_TEX}: no importa nada (A lo importa desde historia.js: sin ciclos)`);
  const previos = ['src/historia-escenas-acto1.js', 'src/historia-texto-acto1.js', 'src/historia-escenas-acto2.js', 'src/historia-texto-acto2.js', 'src/historia-escenas-acto3.js', 'src/historia-texto-acto3.js', 'src/historia-escenas-util.js', 'src/historia-escenas-acto2-util.js', 'src/historia-escenas-acto3-util.js', 'src/historia-escenas-optativas.js', 'src/historia-texto-optativas.js', 'src/historia.js'].map(leer).join('\n');
  const mios = [...(textoE + '\n' + textoT).matchAll(/^export\s+(?:const|function)\s+([A-Za-z0-9_$]+)/gm)].map((m) => m[1]);
  c(new Set(mios).size === mios.length && mios.every((x) => !new RegExp(`^export\\s+(?:const|function)\\s+${x}\\b`, 'm').test(previos)), 'los nombres exportados chocan entre sí o con los de antes');
  for (const x of ['ESCENAS_LAZOS', 'IDS_LAZOS', 'EFECTOS_LAZOS', 'DISPARO_LAZOS', 'POR_DEFECTO_LAZOS']) c(new RegExp(`^export const ${x} =`, 'm').test(textoE), `${ARCH_ESC}: falta el export «${x}»`);
  for (const x of ['TEXTO_LAZOS', 'VECINOS_LAZO', 'lazoCumple', 'finalDeLazos', 'fraseDeGuia']) c(new RegExp(`^export (?:const|function) ${x}\\b`, 'm').test(textoT), `${ARCH_TEX}: falta el export «${x}»`);
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
ok(real.ME.IDS_LAZOS.length === 1, 'una escena nueva (la de Sofía)');

// la cota que usa la suite, a la vista: Belisario sólo llega a 1, Sofía a 2, y sólo Tito puede quedar tirante (D2 = dejar el coihue en pie)
{
  const k = cotas(real.ME.ESCENAS_LAZOS);
  ok(k.arriba.sofia === 2 && k.arriba.belisario === 2, `cota: Sofía 2 y Belisario 2 (${k.arriba.sofia}, ${k.arriba.belisario})`);
  ok(k.arriba.nicanor >= 3 && k.arriba.rosa >= 3 && k.arriba.tito >= 3 && k.arriba.tobias >= 3 && k.arriba.herminia >= 3, 'cota: Nicanor (con encargos), Rosa, Tito, Tobías y Herminia llegan a 3');
  ok(Object.keys(k.abajo).filter((q) => VECINOS.includes(q)).join() === 'tito', `cota: de los siete, el único que puede quedar tirante es Tito (${Object.keys(k.abajo).join()})`);
}

// los pedidos para A, documentados; la prueba en verify:pasos
{
  const cambios = existsSync(join(raiz, 'CAMBIOS_4_18_2_B.md')) ? leer('CAMBIOS_4_18_2_B.md') : '';
  ok(cambios.length > 2500, 'existe CAMBIOS_4_18_2_B.md');
  for (const x of ['foto-valle', 'lazo:sofia:2', 'lazo:sofia:1', 'raro:foto-del-valle', 'TEXTO_LAZOS', 'finalDeLazos', 'lazoCumple', 'fraseDeGuia', 'VECINOS_LAZO', 'LAZOS_SECUNDARIOS', 'foto-sofia', 'sanearHistoria', 'cuando']) ok(cambios.includes(x), `CAMBIOS_4_18_2_B.md explica «${x}»`);
  for (const q of VECINOS) ok(cambios.includes('`' + q + '`'), `CAMBIOS_4_18_2_B.md nombra a «${q}»`);
  for (const id of Object.values(real.MT.TEXTO_LAZOS.charlas).flat().map((l) => l.id)) ok(cambios.includes(id), `CAMBIOS_4_18_2_B.md lista la línea de charla «${id}»`);
  ok(!/scratch/i.test(cambios) && !INGLES.test(cambios.replace(/`[^`]*`/g, '')), 'los cambios, en castellano y sin mencionar lo que no se menciona');
  const pkg = JSON.parse(leer('package.json'));
  ok(/node pruebas\/verificar-4-18-2-lazos-escenas\.mjs/.test(pkg.scripts?.['verify:pasos'] || ''), 'la prueba está en verify:pasos');
}

// ---------------------------------------------------------------- MUTACIONES de datos: se clona lo exportado y se rompe una garantía
const clon = (o) => JSON.parse(JSON.stringify(o));
function mutanteDatos(tocar) {
  const ME = { ...real.ME, ESCENAS_LAZOS: clon(real.ME.ESCENAS_LAZOS), DISPARO_LAZOS: clon(real.ME.DISPARO_LAZOS), EFECTOS_LAZOS: [...real.ME.EFECTOS_LAZOS], IDS_LAZOS: [...real.ME.IDS_LAZOS] };
  const MT = { ...real.MT, TEXTO_LAZOS: clon(real.MT.TEXTO_LAZOS) };
  tocar(ME.ESCENAS_LAZOS['foto-valle'], MT.TEXTO_LAZOS, ME.DISPARO_LAZOS, ME, MT);
  return todo(ME, MT, real.textoE, real.textoT);
}
const dial = (e) => e.pasos.find((p) => p.tipo === 'dialogo');
const elec = (e, id) => e.pasos.find((p) => p.tipo === 'eleccion' && p.id === id);
const MUT_DATOS = [
  // la escena
  ['un id que choca con una optativa', (e, t, d, ME) => { const x = ME.ESCENAS_LAZOS['foto-valle']; delete ME.ESCENAS_LAZOS['foto-valle']; ME.ESCENAS_LAZOS['vuelta-faro'] = { ...x, id: 'vuelta-faro' }; }],
  ['una escena de más', (e, t, d, ME) => { ME.ESCENAS_LAZOS['extra'] = { ...clon(e), id: 'extra' }; }],
  ['el id no coincide con la clave', (e) => { e.id = 'foto-otra'; }],
  ['acto mal puesto', (e) => { e.acto = 3; }],
  ['un plano desconocido', (e) => { e.pasos.find((p) => p.tipo === 'plano').plano = 'cenital'; }],
  ['pocos planos', (e) => { const pl = e.pasos.filter((p) => p.tipo === 'plano'); e.pasos = e.pasos.filter((p) => !pl.slice(2).includes(p)); }],
  ['sin los fundidos del paso de la hora', (e) => { e.pasos = e.pasos.filter((p) => p.tipo !== 'fundido'); }],
  ['una escena sin resumen', (e) => { delete e.resumen; }],
  ['una escena efímera', (e) => { e.efimera = true; }],
  ['una opción sin efecto ni sabor', (e) => { delete elec(e, 'valle-pide').opciones[0].sabor; }],
  ['una opción de la luz sin efecto', (e) => { const o = elec(e, 'valle-luz').opciones[1]; delete o.efecto; o.sabor = true; }],
  ['una opción con efecto y sabor', (e) => { elec(e, 'valle-luz').opciones[0].sabor = true; }],
  ['cuatro opciones', (e) => { elec(e, 'valle-copia').opciones.push({ id: 'otra', texto: 'Otra.', sabor: true }); }],
  ['una elección repetida con un acto', (e) => { elec(e, 'valle-pide').id = 'mirador-graciela'; }],
  ['una elección repetida entre las de la escena', (e) => { elec(e, 'valle-copia').id = 'valle-pide'; }],
  ['un paso que mira una elección inexistente', (e) => { e.pasos.push({ tipo: 'dialogo', quien: 'narra', lineas: ['Hola, hola.'], si: { eleccion: 'no-hay', es: 'a' } }); }],
  ['un condicional colado como línea', (e) => { dial(e).lineas.push({ si: { eleccion: 'valle-pide', es: 'dale' } }); }],
  ['una línea larguísima', (e) => { dial(e).lineas.push('Larguísimo. '.repeat(30)); }],
  ['una opción larguísima', (e) => { elec(e, 'valle-pide').opciones[0].texto = 'Dale, me paro donde quieras que me pare y no me muevo '.repeat(2); }],
  ['inglés', (e) => { dial(e).lineas.push('Una frase with algo raro.'); }],
  ['religión', (e) => { dial(e).lineas.push('Gracias a Dios salió la foto.'); }],
  ['algo explícito', (e) => { dial(e).lineas.push('Se dieron un beso largo.'); }],
  ['algo que no existe en el juego', (e) => { dial(e).lineas.push('Mañana vuelvo al hospedaje.'); }],
  ['un número a la vista', (e) => { dial(e).lineas.push('Sofía suma 2 puntos de lazo.'); }],
  ['una persona que no existe', (e) => { dial(e).lineas.push('Me lo dijo la tía Hortensia.'); }],
  ['un hablante sin declarar', (e) => { dial(e).quien = 'sofiita'; }],
  ['Sofía con otra clave', (e) => { e.personajes.sofia.clave = 'fotografa2'; }],
  ['una pose que no existe', (e) => { e.pasos.push({ tipo: 'gesto', quien: 'sofia', accion: 'posar', pose: 'volar' }); }],
  ['un lugar que no existe', (e) => { e.pasos.find((p) => p.tipo === 'plano').a = { lugar: 'aeropuerto' }; }],
  ['un efecto fuera de la convención', (e) => { e.pasos.push({ tipo: 'efecto', nombre: 'regalo:foto' }); }],
  ['un lazo exagerado', (e, t, d, ME) => { elec(e, 'valle-luz').opciones[0].efecto = 'lazo:sofia:7'; }],
  ['una condición fuera de la convención', (e) => { e.pasos.push({ tipo: 'dialogo', quien: 'narra', lineas: ['Hola, hola.'], si: { cond: 'magia', args: {} } }); }],
  ['EFECTOS desactualizado', (e, t, d, ME) => { ME.EFECTOS_LAZOS.pop(); }],
  // lo que la escena da
  ['esperar da +1 en vez de +2', (e) => { elec(e, 'valle-luz').opciones[0].efecto = 'lazo:sofia:1'; }],
  ['apurar da +2', (e) => { elec(e, 'valle-luz').opciones[1].efecto = 'lazo:sofia:2'; }],
  ['moverse da +2', (e) => { elec(e, 'valle-luz').opciones[2].efecto = 'lazo:sofia:2'; }],
  ['un lazo de más al final (se sumaría dos veces)', (e, t, d, ME) => { e.pasos.push({ tipo: 'efecto', nombre: 'lazo:sofia:1' }); }],
  ['la escena mueve a otro vecino', (e, t, d, ME) => { e.pasos.push({ tipo: 'efecto', nombre: 'lazo:ramon:1' }); ME.EFECTOS_LAZOS.push('lazo:ramon:1'); ME.EFECTOS_LAZOS.sort(); }],
  ['la escena da un objeto', (e, t, d, ME) => { e.pasos.push({ tipo: 'efecto', nombre: 'dar:pan-casero:1' }); ME.EFECTOS_LAZOS.push('dar:pan-casero:1'); ME.EFECTOS_LAZOS.sort(); }],
  ['sin el raro', (e, t, d, ME) => { e.pasos = e.pasos.filter((p) => p.nombre !== 'raro:foto-del-valle'); ME.EFECTOS_LAZOS = ME.EFECTOS_LAZOS.filter((x) => x !== 'raro:foto-del-valle'); }],
  ['si se saltea vale esperar (+2)', (e) => { elec(e, 'valle-luz').porDefecto = 0; }],
  ['sin la espera de la luz', (e) => { e.pasos = e.pasos.filter((p) => !(p.tipo === 'dialogo' && p.quien === 'sofia' && p.si?.eleccion === 'valle-luz' && p.si.es === 'esperar')); }],
  ['sin la variante de moverse', (e) => { e.pasos = e.pasos.filter((p) => !(p.si?.eleccion === 'valle-luz' && p.si.es === 'mover')); }],
  ['la luz de las cinco a otra hora', (e) => { e.pasos.find((p) => p.tipo === 'hora').a = 21; }],
  ['sin los puntitos verdes', (e) => { const p = e.pasos.find((q) => q.tipo === 'dialogo' && q.lineas.some((l) => /Es el vidrio/.test(typeof l === 'string' ? l : l.texto))); e.pasos.splice(e.pasos.indexOf(p), 1); }],
  ['habla otra persona', (e) => { e.personajes.tito = { clave: 'carpintero', nombre: 'Tito', color: '#b98a5c' }; dial(e).quien = 'tito'; }],
  // el raro, el tablón y el disparo
  ['un raro sin texto', (e, t) => { t.raro['foto-del-valle'].texto = ''; }],
  ['un raro huérfano', (e, t) => { t.raro['suelto'] = { titulo: 'Suelto', texto: 'Esto no lo anota ninguna escena.', cap: 7, donde: 'valle' }; }],
  ['un raro de otro capítulo', (e, t) => { t.raro['foto-del-valle'].cap = 9; }],
  ['un raro que choca con los actos', (e, t) => { t.raro['foto-ojo'] = t.raro['foto-del-valle']; delete t.raro['foto-del-valle']; }],
  ['el tablón con otro nombre', (e, t) => { t.tablon['foto-del-valle'] = t.tablon['foto-valle']; delete t.tablon['foto-valle']; }],
  ['el tablón sin el capítulo de la escena', (e, t) => { t.tablon['foto-valle'].caps = [8, 9]; }],
  ['el tablón con capítulos salteados', (e, t) => { t.tablon['foto-valle'].caps = [7, 9]; }],
  ['el tablón sin línea de hecha', (e, t) => { delete t.tablon['foto-valle'].hecha; }],
  ['el tablón con la misma línea abierta y hecha', (e, t) => { t.tablon['foto-valle'].hecha = t.tablon['foto-valle'].ofrecida; }],
  ['falta la tabla de disparo', (e, t, d) => { delete d['foto-valle']; }],
  ['disparo con otro capítulo', (e, t, d) => { d['foto-valle'].cap = 5; }],
  ['disparo con otra optativa', (e, t, d) => { d['foto-valle'].objetivo = 'foto-sofia'; }],
  ['disparo que dice que la ofrece una escena', (e, t, d) => { d['foto-valle'].ofrece = 'foto-sofia'; }],
  // la guía
  ['la guía sin un vecino', (e, t) => { delete t.guia.belisario; }],
  ['la guía sin la frase de confianza', (e, t) => { delete t.guia.rosa.frases['de confianza']; }],
  ['la guía con una frase tirante de Rosa', (e, t) => { t.guia.rosa.frases.tirante = 'Te habla del clima y de nada más.'; }],
  ['la guía sin la frase tirante de Tito', (e, t) => { delete t.guia.tito.frases.tirante; }],
  ['la guía con una palabra inventada', (e, t) => { t.guia.nicanor.frases['de oro'] = 'Te regala el lago entero.'; }],
  ['la guía con un número', (e, t) => { t.guia.sofia.frases['de la casa'] = 'Tiene 3 fotos tuyas en el estudio.'; }],
  ['la guía sin rol', (e, t) => { delete t.guia.tobias.rol; }],
  // el final
  ['el final sin un vecino', (e, t) => { delete t.final.nicanor; }],
  ['el final de Belisario pide 3 (no llega)', (e, t) => { t.final.belisario[0].min = 3; }],
  ['el final de Sofía pide 3 (con las escenas no llega)', (e, t) => { t.final.sofia[0].min = 3; }],
  ['el final de Rosa pide 4', (e, t) => { t.final.rosa[0].min = 4; }],
  ['el final de Rosa con un mínimo y un máximo', (e, t) => { t.final.rosa[0].max = 3; }],
  ['el final de Rosa sin rango', (e, t) => { delete t.final.rosa[0].min; }],
  ['una línea tirante de Rosa (no puede quedar así)', (e, t) => { t.final.rosa.push({ id: 'final-rosa-tirante', max: -1, texto: 'Rosa te saluda de lejos, con el delantal puesto, y no se acerca nunca.' }); }],
  ['la tirante de Tito pide −2', (e, t) => { t.final.tito[1].max = -2; }],
  ['la tirante de Tito sin máximo', (e, t) => { delete t.final.tito[1].max; t.final.tito[1].min = 1; }],
  ['dos finales con el mismo id', (e, t) => { t.final.tobias[0].id = t.final.rosa[0].id; }],
  ['un final largo', (e, t) => { t.final.herminia[0].texto += ' Y además dice cosas largas sobre otras cosas largas de la vida entera.'.repeat(3); }],
  ['un final con un número', (e, t) => { t.final.nicanor[0].texto = 'Nicanor te silba tres veces desde el muelle cuando salen las luces sobre el lago.'.replace('tres', '3'); }],
  ['un final con inglés', (e, t) => { t.final.belisario[0].texto = 'Belisario baja con la tropa and se detiene en tu puerta aunque no le quede de camino.'; }],
  ['un final con un nombre que no existe', (e, t) => { t.final.tobias[0].texto = 'Tobías te deja un canto liso en el umbral, y dice que se lo mandó la tía Hortensia desde lejos.'; }],
  // las charlas
  ['la charla sin un vecino', (e, t) => { delete t.charlas.belisario; }],
  ['la charla de Belisario pide 3 (no llega)', (e, t) => { t.charlas.belisario[0].cuando.lazo.min = 3; }],
  ['la charla de Sofía pide 3 (no llega)', (e, t) => { t.charlas.sofia[0].cuando.lazo.min = 3; }],
  ['la charla con id repetido de un acto', (e, t) => { t.charlas.rosa[0].id = 'rosa-c2-frasco'; }],
  ['la charla con id repetido del final', (e, t) => { t.charlas.rosa[0].id = 'final-rosa'; }],
  ['la charla que mira una escena inexistente', (e, t) => { t.charlas.sofia[1].cuando = { escena: 'foto-azul' }; }],
  ['la charla de después antes de su escena', (e, t) => { t.charlas.sofia[1].cap = 5; }],
  ['la charla que mira el lazo y una escena', (e, t) => { t.charlas.rosa[0].cuando.escena = 'frasco-rosa'; }],
  ['la charla sin condición', (e, t) => { delete t.charlas.nicanor[0].cuando; }],
  ['la charla con mínimo y máximo', (e, t) => { t.charlas.tobias[0].cuando.lazo.max = 3; }],
  ['la charla de Herminia antes de cualquier escena que le dé lazo', (e, t) => { t.charlas.herminia[0].cap = 2; }],
  ['la charla tirante de Rosa', (e, t) => { t.charlas.rosa.push({ id: 'lazo-rosa-tirante', cap: 3, texto: 'Buen día, vecino. Hoy no hay pan, lo siento mucho, vuelva mañana si quiere.', cuando: { lazo: { max: -1 } } }); }],
  ['la charla tirante de Tito, antes de su escena', (e, t) => { t.charlas.tito[1].cap = 3; }],
  ['la charla tirante de Tito sin la tirante', (e, t) => { t.charlas.tito.pop(); t.charlas.tito.push({ id: 'otra-linea-tito', cap: 5, texto: 'La mesa larga queda para cuando tengamos veinte sillas y mucha harina.', cuando: { lazo: { min: 1 } } }); }],
  ['dos charlas de lazo alto para Tobías', (e, t) => { t.charlas.tobias.push({ id: 'lazo-tobias-otra', cap: 6, texto: 'La piedra de hoy salió mejor que la de ayer, y la de ayer mejor que la anterior.', cuando: { lazo: { min: 2 } } }); }],
  ['la charla repetida palabra por palabra', (e, t) => { t.charlas.tobias[0].texto = t.charlas.nicanor[0].texto; }],
  ['la charla con un número', (e, t) => { t.charlas.rosa[0].texto = 'Hoy te guardé 2 hogazas del fondo del horno, las más tostadas, y no hace falta que me des las gracias.'; }],
  ['la charla con la palabra lazo', (e, t) => { t.charlas.rosa[0].texto = 'Entre vos y yo hay un lazo grande, de esos que no se explican con pan ni con harina.'; }],
  ['la charla con religión', (e, t) => { t.charlas.herminia[0].texto = 'A vos te hablo más despacio, m\'hijo, como se le habla a un santo en la capilla.'; }],
  ['la charla vacía', (e, t) => { t.charlas.nicanor[0].texto = 'Hola.'; }],
];
let atrapadas = 0;
for (const [nombre, tocar] of MUT_DATOS) {
  const r = mutanteDatos(tocar);
  if (r.length) atrapadas++; else console.log('NO ATRAPÓ la mutación de datos: ' + nombre);
  ok(r.length > 0, `atrapa la mutación de datos «${nombre}»`);
}
ok(mutanteDatos(() => {}).length === 0, 'una copia exacta de los datos pasa');

// ---------------------------------------------------------------- MUTACIONES de código: copia mutada en una carpeta temporal, importada con ?v=
const tmp = mkdtempSync(join(tmpdir(), 'hx-lazos-'));
const DEPS = ['historia-escenas-util.js', 'historia-escenas-acto2-util.js', 'historia-escenas-acto3-util.js'];
let atrapadasCodigo = 0;
const MUT_CODIGO = [
  ['falta el export DISPARO_LAZOS', 'E', (t) => t.replace('export const DISPARO_LAZOS', 'const DISPARO_LAZOS')],
  ['dos exports en una línea', 'E', (t) => t.replace('export const POR_DEFECTO_LAZOS = {};', 'export const POR_DEFECTO_LAZOS = {}, OTRO_MAS = 1;')],
  ['un export con ñ', 'T', (t) => t.replace('export function fraseDeGuia(', 'export const fraseDeÑ = 1;\nexport function fraseDeGuia(')],
  ['un import partido en dos líneas', 'E', (t) => t.replace("import { FRENTE, con, apagon, hora, horaMas } from './historia-escenas-acto2-util.js';", "import {\n  FRENTE, con, apagon, hora, horaMas } from './historia-escenas-acto2-util.js';")],
  ['el texto importa algo (ciclo posible)', 'T', (t) => "import { lazoDe } from './historia.js';\n" + t],
  ['fines de línea CRLF', 'T', (t) => t.replace(/\n/g, '\r\n')],
  ['un módulo que toca el DOM', 'T', (t) => t + '\nexport const ancho = () => window.innerWidth;\n'],
  ['un id con ñ', 'E', (t) => t.replace("'foto-valle': fotoValle,", "'foto-valle': fotoValle,\n  'ñandu': { ...fotoValle, id: 'ñandu' },")],
  ['EFECTOS fijo en vez de calculado', 'E', (t) => t.replace(/export const EFECTOS_LAZOS = .*$/m, "export const EFECTOS_LAZOS = ['raro:foto-del-valle'];")],
  ['IDS con una escena de más', 'E', (t) => t.replace('export const IDS_LAZOS = Object.keys(ESCENAS_LAZOS);', "export const IDS_LAZOS = [...Object.keys(ESCENAS_LAZOS), 'otra'];")],
  ['esperar da +1 en el código', 'E', (t) => t.replace("{ efecto: 'lazo:sofia:2' }", "{ efecto: 'lazo:sofia:1' }")],
  ['apurar da +2 en el código', 'E', (t) => t.replace("opcion('apurar', 'Decirle que saque nomás, que así está bien.', { efecto: 'lazo:sofia:1' })", "opcion('apurar', 'Decirle que saque nomás, que así está bien.', { efecto: 'lazo:sofia:2' })")],
  ['la elección de la luz con otro defecto', 'E', (t) => t.replace('], 1),\n    con(narra(\'Te quedás.', '], 0),\n    con(narra(\'Te quedás.')],
  ['la hora del revelado se pasa de rosca', 'E', (t) => t.replace('horaMas(1, { dur: 0 })', 'horaMas(9, { dur: 0 })')],
  ['la luz de las cinco a las 21', 'E', (t) => t.replace('hora(16.8, { dur: 0 })', 'hora(21, { dur: 0 })')],
  ['lazoCumple ignora el máximo', 'T', (t) => t.replace('return v >= min && v <= max;', 'return v >= min;')],
  ['lazoCumple con mínimo exclusivo', 'T', (t) => t.replace('return v >= min && v <= max;', 'return v > min && v <= max;')],
  ['lazoCumple sin tomar el lazo entero', 'T', (t) => t.replace('const v = Math.trunc(Number(n) || 0);', 'const v = Number(n);')],
  ['finalDeLazos toma siempre la primera línea', 'T', (t) => t.replace('lista.find((x) => lazoCumple(x, f(quien)))', 'lista[0]')],
  ['finalDeLazos en otro orden', 'T', (t) => t.replace('for (const quien of VECINOS_LAZO) {\n    const lista', 'for (const quien of [...VECINOS_LAZO].reverse()) {\n    const lista')],
  ['finalDeLazos devuelve las líneas enteras y no los textos', 'T', (t) => t.replace('if (l) salida.push(l.texto);', 'if (l) salida.push(l);')],
  ['finalDeLazos que no soporta basura', 'T', (t) => t.replace("const f = typeof lazoDe === 'function' ? lazoDe : () => 0;", 'const f = lazoDe;')],
  ['fraseDeGuia sin hasOwn', 'T', (t) => t.replace("const g = Object.hasOwn(TEXTO_LAZOS.guia, quien) ? TEXTO_LAZOS.guia[quien] : null;\n  return g && Object.hasOwn(g.frases, palabra) ? g.frases[palabra] : null;", 'const g = TEXTO_LAZOS.guia[quien];\n  return g && g.frases[palabra] ? g.frases[palabra] : null;')],
  ['VECINOS_LAZO sin uno', 'T', (t) => t.replace("'belisario', 'sofia'];", "'belisario'];")],
  ['menciona lo que no se menciona', 'E', (t) => t + '\n// scratch\n'],
];
try {
  for (const d of DEPS) copyFileSync(join(raiz, 'src', d), join(tmp, d));
  for (const [i, [nombre, cual, cambiar]] of MUT_CODIGO.entries()) {
    const tE = cual === 'E' ? cambiar(real.textoE) : real.textoE;
    const tT = cual === 'T' ? cambiar(real.textoT) : real.textoT;
    ok(tE !== real.textoE || tT !== real.textoT, `la mutación de código «${nombre}» cambia el archivo`);
    writeFileSync(join(tmp, 'historia-escenas-lazos.js'), tE);
    writeFileSync(join(tmp, 'historia-texto-lazos.js'), tT);
    let r;
    try { const m = await cargar(tmp); r = todo(m.ME, m.MT, m.textoE, m.textoT); } catch (err) { r = ['no carga: ' + err.message]; }
    if (r.length) atrapadasCodigo++; else console.log('NO ATRAPÓ la mutación de código: ' + nombre + ` (${i})`);
    ok(r.length > 0, `atrapa la mutación de código «${nombre}»`);
  }
  // control: la copia sin tocar, importada igual desde la carpeta temporal, pasa
  writeFileSync(join(tmp, 'historia-escenas-lazos.js'), real.textoE);
  writeFileSync(join(tmp, 'historia-texto-lazos.js'), real.textoT);
  const m = await cargar(tmp);
  const r = todo(m.ME, m.MT, m.textoE, m.textoT);
  ok(r.length === 0, 'la copia sin mutar, cargada desde la carpeta temporal, pasa: ' + r.slice(0, 5).join(' | '));
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
ok(atrapadas === MUT_DATOS.length && atrapadasCodigo === MUT_CODIGO.length, `atrapó ${atrapadas}/${MUT_DATOS.length} mutaciones de datos y ${atrapadasCodigo}/${MUT_CODIGO.length} de código`);

console.log(fallas ? `FALLARON ${fallas} de ${n}` : `verificar-4-18-2-lazos-escenas: ${n} comprobaciones OK (${MUT_DATOS.length} mutaciones de datos y ${MUT_CODIGO.length} de código atrapadas)`);
process.exit(fallas ? 1 : 0);
