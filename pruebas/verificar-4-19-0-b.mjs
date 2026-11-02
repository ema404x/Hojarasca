// 4.19.0 (B): las dos escenas optativas nuevas del acto III que le dan a Belisario y a Sofía el lazo que les faltaba para llegar a 3 como los demás
// (`ultimo-cruce` y `del-otro-lado`, en src/historia-escenas-lazos.js), su dato de registro (`OPTATIVA_BELISARIO`, `OPTATIVA_SOFIA_FRENTE`, `OPTATIVAS_LAZOS`),
// los textos (tablón, charla de después, raro, líneas de final) y la firma nueva `finalDeLazos(lazoDe, final)` (la línea de Nicanor de las luces sólo sale con
// el final del trato; con la pelea sale otra). Sólo Node. Cada escena se valida con el director real (escenas.js), se corre por TODOS sus caminos de elección
// (con las variantes por decisión), se salta a varios cuadros y se comprueba que dé exactamente su +1 una sola vez, que anote su raro y que no toque la hora,
// los objetos ni la plata; los textos, sin inglés, sin religión, sin nada explícito, sin números ni la palabra «lazo» a la vista; ninguna frase de cinco
// palabras repetida entre las líneas de final, las charlas y las piezas del final del juego; y el dato del registro se pasa por el `optativaDeLazo` y el
// `disparadoresDeLazo` reales de A.
//
// MUTACIONES que miden de verdad: la suite entera (`todo`) recibe los MÓDULOS como parámetro. Las de datos clonan lo exportado y rompen una garantía; las de
// CÓDIGO escriben una copia mutada de los dos archivos en una carpeta temporal (con sus tres dependencias) y la importan con `?v=<n>`, así cada mutante es un
// módulo nuevo (no el de la caché). Una copia sin mutar, cargada igual, tiene que pasar. La prueba exige atraparlas todas.
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
import { CAPITULOS } from '../src/historia.js';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => readFileSync(join(raiz, f), 'utf8');
let n = 0, fallas = 0;
const ok = (c, t) => { n++; if (!c) { fallas++; console.log('FALLA ' + t); } };

const ARCH_ESC = 'src/historia-escenas-lazos.js', ARCH_TEX = 'src/historia-texto-lazos.js';
const VECINOS = ['rosa', 'tito', 'tobias', 'herminia', 'nicanor', 'belisario', 'sofia'];
const PALABRAS = ['conocido', 'de confianza', 'de la casa'];
const NOMBRES_OK = new Set(['Administración', 'Aldea', 'Arroyo', 'Belisario', 'Don', 'Duendes', 'Elsa', 'Ercilia', 'Esquel', 'Estación', 'Eusebio', 'Fermín', 'Graciela', 'Herminia',
  'Josefina', 'Nicanor', 'Nélida', 'Ramal', 'Ramón', 'Refugio', 'Rosa', 'Valle', 'Tito', 'Tobías', 'Sofía', 'Puesto', 'Alto', 'Marta', 'Ahí', 'Ah', 'Mirá', 'Vos', 'Ya', 'Diolch', 'Lo', 'Mate', 'Paso', 'Hay', 'Esa']);
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


// ---------------------------------------------------------------- lo de la 4.19.0
const NUEVAS = ['ultimo-cruce', 'del-otro-lado'];
const ESPERADO = {
  'ultimo-cruce': { quien: 'belisario', clave: 'belisario', lazo: 'lazo:belisario:1', raro: 'raro:mulas-saludan', rasgo: 'mulas-saludan', optativa: 'OPTATIVA_BELISARIO', donde: 'Puesto del Paso', elecs: ['cruce-pregunta', 'cruce-despedida'] },
  'del-otro-lado': { quien: 'sofia', clave: 'fotografa', lazo: 'lazo:sofia:1', raro: 'raro:foto-de-sofia', rasgo: 'foto-de-sofia', optativa: 'OPTATIVA_SOFIA_FRENTE', donde: 'estudio de fotos', elecs: ['otro-encuadre', 'otra-mano'] },
};
const ids5 = (t) => { const p = t.toLowerCase().replace(/[^\p{L}\s]/gu, ' ').split(/\s+/).filter(Boolean); const r = new Set(); for (let i = 0; i + 5 <= p.length; i++) r.add(p.slice(i, i + 5).join(' ')); return r; };
const idCap = (id) => CAPITULOS.findIndex((x) => x.id === id) + 1;

// ---------------------------------------------------------------- LA SUITE: recibe los módulos (reales o mutados) y devuelve lo que falló
function todo(ME, MT, textoE, textoT, O = {}) {
  const f = [];
  const c = (cond, t) => { if (!cond) f.push(t); };
  const TODAS = ME.ESCENAS_LAZOS || {}, DIS = ME.DISPARO_LAZOS || {}, EFS_TODOS = ME.EFECTOS_LAZOS || [];
  const TEX = MT.TEXTO_LAZOS || {};
  const ESC = Object.fromEntries(NUEVAS.filter((id) => Object.hasOwn(TODAS, id)).map((id) => [id, TODAS[id]]));
  const escenas = Object.values(ESC);
  const EFS = [...new Set(Object.values(TODAS).flatMap((e) => efectosDe(e)))].sort();
  const vacia = (id) => ({ id, pasos: [], capitulo: 9, personajes: {} });
  const U = ESC['ultimo-cruce'] || vacia('ultimo-cruce'), D = ESC['del-otro-lado'] || vacia('del-otro-lado');

  // 0) los exports y el conjunto de escenas
  c(Object.keys(TODAS).join() === 'foto-valle,ultimo-cruce,del-otro-lado', 'ESCENAS_LAZOS son exactamente foto-valle, ultimo-cruce y del-otro-lado, en ese orden: ' + Object.keys(TODAS).join());
  c(Array.isArray(ME.IDS_LAZOS) && ME.IDS_LAZOS.join() === Object.keys(TODAS).join(), 'IDS_LAZOS no son los ids de ESCENAS_LAZOS');
  c(EFS_TODOS.join() === EFS.join(), 'EFECTOS_LAZOS no es exactamente lo que usan las escenas (calculado y ordenado)');
  c(Array.isArray(ME.OPTATIVAS_LAZOS) && ME.OPTATIVAS_LAZOS.length === 2 && ME.OPTATIVAS_LAZOS[0] === ME.OPTATIVA_BELISARIO && ME.OPTATIVAS_LAZOS[1] === ME.OPTATIVA_SOFIA_FRENTE, 'OPTATIVAS_LAZOS: las dos, Belisario y después Sofía');
  c(ME.POR_DEFECTO_LAZOS && typeof ME.POR_DEFECTO_LAZOS === 'object' && Object.keys(ME.POR_DEFECTO_LAZOS).length === 0, 'POR_DEFECTO_LAZOS sigue vacío');

  // 1) ids sin chocar con nada, sin ñ
  c(Object.entries(TODAS).every(([k, e]) => e && e.id === k), 'el id de cada escena coincide con su clave');
  c(NUEVAS.every((id) => !Object.hasOwn(ESCENAS_PREVIAS, id) && !Object.hasOwn(ESCENAS_PREVIAS, id.toUpperCase())), 'un id de escena choca con los actos o las optativas');
  c(Object.keys(TODAS).every((id) => /^[a-z0-9][a-z0-9-]*$/.test(id)), 'ids de escena sólo con minúsculas sin ñ, números y guiones');

  // 2) válidas con el director real, en su acto y capítulo
  for (const e of escenas) {
    const v = validarEscena(e);
    c(v.ok, `${e?.id}: no valida (${(v.errores || []).join('; ')})`);
    c(typeof e.resumen === 'string' && e.resumen.length > 60 && e.resumen.length <= 420 && typeof e.titulo === 'string' && e.titulo.length > 2, `${e?.id}: sin resumen o título (o resumen largo)`);
    c(e.acto === 3 && e.capitulo === 9, `${e?.id}: es del acto III, capítulo 9 (acto ${e?.acto}, capítulo ${e?.capitulo})`);
    c(!e.efimera, `${e?.id}: no puede ser efímera`);
    c(e.pasos.filter((p) => p.tipo === 'plano').length >= 6, `${e.id}: menos de seis planos de cámara`);
    c(e.pasos.filter((p) => p.tipo === 'dialogo').length >= 6, `${e.id}: pocos diálogos`);
  }
  c(D.pasos.some((p) => p.tipo === 'fundido') && D.pasos.some((p) => p.tipo === 'sonido'), 'del-otro-lado: el clac de la cámara y el fundido al cuarto oscuro');
  c(!U.pasos.some((p) => p.tipo === 'hora' || p.tipo === 'fundido'), 'ultimo-cruce: no cambia la hora ni apaga la pantalla');
  c(!D.pasos.some((p) => p.tipo === 'hora'), 'del-otro-lado: no cambia la hora');

  // 3) efectos y condiciones: sólo el lazo del vecino (+1, una vez) y su raro; nada de objetos ni plata ni mundo
  for (const [id, e] of Object.entries(ESC)) {
    const X = ESPERADO[id];
    const efs = efectosDe(e);
    for (const nombre of efs) c(parsearEfectoActo3(nombre), `${id}: el efecto «${nombre}» no sigue la convención`);
    c(efs.slice().sort().join() === [X.lazo, X.raro].sort().join(), `${id}: sólo ${X.lazo} y ${X.raro} (sin premios de objetos ni de plata): ${efs.join(',')}`);
    const sueltos = e.pasos.filter((p) => p.tipo === 'efecto').map((p) => p.nombre);
    c(sueltos.filter((x) => x === X.lazo).length === 1, `${id}: el lazo se da una sola vez, al final, fuera de toda elección`);
    c(e.pasos.filter((p) => p.tipo === 'eleccion').every((p) => p.opciones.every((o) => !o.efecto)), `${id}: ninguna opción pesa (el +1 lo da la escena entera)`);
    c(e.pasos.filter((p) => p.tipo === 'efecto').slice(-2).map((p) => p.nombre).join() === [X.lazo, X.raro].join(), `${id}: termina con el lazo y lo raro`);
    for (const cond of condicionesDe(e)) c(cond === 'decision' && CONDICIONES_ACTO3.includes(cond), `${id}: la condición «${cond}» no está permitida`);
    const elecs = new Set(e.pasos.filter((p) => p.tipo === 'eleccion').map((p) => p.id));
    for (const p of e.pasos) if (p.si && typeof p.si.eleccion === 'string') c(elecs.has(p.si.eleccion), `${id}: mira la elección «${p.si.eleccion}», que no existe`);
    for (const p of e.pasos.filter((q) => q.tipo === 'dialogo')) for (const l of p.lineas || []) c(typeof l === 'string' || (l && typeof l.texto === 'string'), `${id}: una línea de diálogo no es texto`);
  }
  c(!U.pasos.some((p) => p.si?.cond === 'decision' && !(p.si.args?.d === 'majada' && p.si.args?.es === 'c')), 'ultimo-cruce: la única variante por decisión es la de la majada vendida (c)');

  // 4) las elecciones: ids únicos entre sí, con los actos y con foto-valle; tres opciones de sabor, una por una de las respuestas
  const idsElec = [];
  for (const [id, e] of Object.entries(ESC)) {
    const X = ESPERADO[id];
    const es = e.pasos.filter((p) => p.tipo === 'eleccion');
    c(es.map((p) => p.id).join() === X.elecs.join(), `${id}: las elecciones son ${X.elecs.join(' y ')}`);
    for (const p of es) {
      idsElec.push(p.id);
      c(!ELECCIONES_PREVIAS.has(p.id) && !(TODAS['foto-valle']?.pasos || []).some((q) => q.tipo === 'eleccion' && q.id === p.id), `${id}/${p.id}: id de elección repetido`);
      c(p.opciones.length === 3, `${id}/${p.id}: tres opciones`);
      c(Number.isInteger(p.porDefecto) && p.porDefecto >= 0 && p.porDefecto < p.opciones.length, `${id}/${p.id}: porDefecto inválido`);
      c((p.pregunta || '').length > 3 && p.pregunta.length <= MAX_PREGUNTA, `${id}/${p.id}: pregunta ausente o larga`);
      for (const o of p.opciones) {
        c(o.sabor === true && !o.efecto, `${id}/${p.id}/${o.id}: la opción es de sabor y no pesa`);
        c(typeof o.texto === 'string' && o.texto.length <= MAX_OPCION, `${id}/${p.id}/${o.id}: opción demasiado larga`);
        c(e.pasos.some((q) => q.tipo === 'dialogo' && q.si?.eleccion === p.id && q.si.es === o.id), `${id}/${p.id}/${o.id}: la opción no tiene respuesta`);
      }
    }
  }
  c(new Set(idsElec).size === idsElec.length, 'elecciones: ids repetidos entre las dos escenas');

  // 5) hablantes, claves, poses, lugares
  for (const [id, e] of Object.entries(ESC)) {
    const X = ESPERADO[id];
    const decl = { ...PERSONAJES_BASE, ...(e.personajes || {}) };
    for (const q of hablantesUsados(e)) c(q && Object.hasOwn(decl, q), `${id}: hablante o actor sin declarar «${q}»`);
    for (const [k, pjx] of Object.entries(e.personajes || {})) {
      if (pjx.clave) c(CLAVES.has(pjx.clave), `${id}: «${k}» usa la clave «${pjx.clave}» que no existe`);
      c(typeof pjx.nombre === 'string' && /^#[0-9a-f]{6}$/i.test(pjx.color || ''), `${id}: personaje «${k}» sin nombre o color`);
    }
    c(e.personajes?.[X.quien]?.clave === X.clave, `${id}: ${X.quien} es la clave del juego «${X.clave}»`);
    c([...hablantesUsados(e)].every((q) => q === X.quien || q === 'narra') && (e.pasos.filter((p) => p.tipo === 'dialogo' && p.quien === X.quien).length >= 5), `${id}: hablan sólo ${X.quien} y la narración (y él habla de verdad)`);
    for (const p of e.pasos) if (p.tipo === 'gesto' && p.accion === 'posar') c(POSES_ESCENA.includes(p.pose), `${id}: pose «${p.pose}» desconocida`);
    for (const l of e.pasos.filter((p) => p.tipo === 'dialogo').flatMap((p) => p.lineas)) if (l && l.gesto) c(POSES_ESCENA.includes(l.gesto.pose), `${id}: pose de línea «${l.gesto.pose}» desconocida`);
    for (const l of lugaresUsados(e)) c(LUGARES.has(l), `${id}: el lugar «${l}» no existe`);
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
    for (const p of e.pasos.filter((q) => q.tipo === 'dialogo' && q.quien === 'narra')) for (const l of p.lineas) c((typeof l === 'string' ? l : l.texto).length <= MAX_PARRAFO, `${e.id}: párrafo de narración largo`);
  }
  const textosNuevos = {
    tablon: Object.fromEntries(NUEVAS.map((id) => [id, TEX.tablon?.[id]])),
    raro: Object.fromEntries(Object.entries(TEX.raro || {}).filter(([k]) => k !== 'foto-del-valle')),
    charlas: Object.values(TEX.charlas || {}).flat().filter((l) => NUEVAS.includes(l?.cuando?.escena)),
    final: Object.values(TEX.final || {}).flat().filter((l) => ['final-belisario-casa', 'final-sofia-casa', 'final-nicanor-pelea', 'final-nicanor'].includes(l?.id)),
  };
  for (const t of textosPlanos(textosNuevos)) { revisar(t, 'texto'); c(t.length <= MAX_PARRAFO, `texto: párrafo largo «${t.slice(0, 40)}»`); }

  // 7) el cuaderno de lo raro: una por escena, en el capítulo y el lugar
  const raros = TEX.raro || {};
  c(Object.keys(raros).sort().join() === 'foto-del-valle,foto-de-sofia,mulas-saludan'.split(',').sort().join(), 'raro: «foto-del-valle» y los dos nuevos («mulas-saludan», «foto-de-sofia»): ' + Object.keys(raros).join());
  for (const [id, X] of Object.entries(ESPERADO)) {
    const r = raros[X.rasgo];
    c(!!r && parsearEfectoActo3(`raro:${X.rasgo}`) && !Object.hasOwn(RARO_PREVIO, X.rasgo), `raro «${X.rasgo}»: fuera de la convención o repetido con los actos`);
    c(!!r && typeof r.texto === 'string' && r.texto.length > 80 && r.texto.length <= MAX_PARRAFO && typeof r.titulo === 'string' && r.titulo.length > 3 && r.cap === 9 && r.donde === X.donde, `raro «${X.rasgo}»: incompleto, de otro capítulo o con otro lugar`);
    c(efectosDe(ESC[id] || vacia(id)).includes(`raro:${X.rasgo}`), `raro «${X.rasgo}»: la escena ${id} no lo anota`);
  }
  c(/huellas?\b[^.]*\b(chicas|chiquitas)/i.test(raros['mulas-saludan']?.texto || '') && /huellas muy chicas/.test(lineasDeDialogo(U).join(' ')), 'raro de las mulas: habla de las huellas chicas y la escena las muestra');
  c(/mano/.test(raros['foto-de-sofia']?.texto || '') && /mano muy chica/.test(lineasDeDialogo(D).join(' ')), 'raro de la foto: habla de la mano chica y la escena la muestra');

  // 8) el tablón de las dos optativas: capítulos seguidos que incluyen el 9 y son los de la ventana del registro
  const tab = TEX.tablon || {};
  c(Object.keys(tab).join() === 'foto-valle,ultimo-cruce,del-otro-lado', 'tablón: foto-valle y las dos nuevas: ' + Object.keys(tab).join());
  for (const id of NUEVAS) {
    const t = tab[id], X = ESPERADO[id], R = ME[X.optativa] || {};
    c(!!t && Array.isArray(t.caps) && t.caps.length >= 2 && t.caps.every((x, i, a) => Number.isInteger(x) && (i === 0 || x === a[i - 1] + 1)) && t.caps[0] === 9 && t.quien === X.quien, `tablón «${id}»: capítulos seguidos que arrancan en el de la escena, de ${X.quien}`);
    c(!!t && t.caps?.[0] === idCap(R.desde) && t.caps?.at(-1) === idCap(R.hasta), `tablón «${id}»: los capítulos son los de la ventana del registro (${R.desde} a ${R.hasta})`);
    c(!!t && typeof t.titulo === 'string' && t.titulo.length > 3 && t.titulo.length <= 40 && typeof t.ofrecida === 'string' && t.ofrecida.length > 40 && typeof t.hecha === 'string' && t.hecha.length > 40 && t.ofrecida !== t.hecha, `tablón «${id}»: incompleto`);
    c(!Object.hasOwn(TEXTO_OPTATIVAS.tablon, id), `tablón «${id}»: no puede estar también en el de las optativas`);
  }
  c(new Set(Object.values(tab).map((t) => t?.titulo)).size === 3, 'tablón: títulos repetidos');

  // 9) el dato del registro y la tabla de disparo
  for (const id of NUEVAS) {
    const X = ESPERADO[id], R = ME[X.optativa];
    c(!!R && R.id === id && R.escena === id && R.quien === X.quien, `${X.optativa}: id, escena y vecino`);
    if (!R) continue;
    c(CAPITULOS.some((x) => x.id === R.desde) && CAPITULOS.some((x) => x.id === R.hasta) && idCap(R.desde) <= idCap(R.hasta), `${X.optativa}: la ventana (${R.desde} a ${R.hasta}) existe y va en orden`);
    c(CAPITULOS.find((x) => x.id === R.desde)?.acto === 3 && CAPITULOS.find((x) => x.id === R.hasta)?.acto === 3, `${X.optativa}: la ventana es del acto III (ninguna cruza de acto)`);
    c(idCap(R.desde) === ESC[id]?.capitulo, `${X.optativa}: la ventana arranca en el capítulo de la escena`);
    const ofr = R.ofrece || {};
    c(Object.keys(ofr).every((k) => ['escenas', 'temas', 'pobladores'].includes(k)), `${X.optativa}: ofrece sólo con escenas, temas o pobladores`);
    for (const e of ofr.escenas || []) c(Object.hasOwn(ESCENAS_PREVIAS, e) || Object.hasOwn(TODAS, e), `${X.optativa}: pide la escena «${e}», que no existe`);
    for (const p of ofr.pobladores || []) c(new RegExp(`^  ${p}: \\{`, 'm').test(FUENTES.aldea), `${X.optativa}: el poblador «${p}» no existe`);
    c(Array.isArray(R.disparo) && R.disparo.length >= 1 && R.disparo.length <= 2, `${X.optativa}: uno o dos disparos`);
    for (const dd of R.disparo || []) {
      c(['auto', 'hablar'].includes(dd.modo), `${X.optativa}: modo de disparo «${dd.modo}»`);
      if (dd.modo === 'hablar') c(CLAVES.has(dd.clave) && dd.clave === X.clave, `${X.optativa}: se habla con ${X.clave}`);
      if (dd.modo === 'auto') c(typeof dd.lugar === 'string' && FUENTES.aldea.includes(`'${dd.lugar}'`) && Number(dd.radio) > 0 && Number(dd.radio) <= 40, `${X.optativa}: llegar a un lugar que existe, con radio razonable`);
      c(Array.isArray(dd.hora) && dd.hora.length === 2 && dd.hora[0] >= 6 && dd.hora[1] <= 19 && dd.hora[0] < dd.hora[1], `${X.optativa}: sólo de día (hora entre 6 y 19)`);
    }
    const d = DIS[id];
    c(!!d && d.cap === 9 && typeof d.jugadorEn === 'string' && d.jugadorEn.length > 10 && typeof d.cuando === 'string' && d.cuando.length > 30 && d.objetivo === id && d.objetivo in tab && d.ofrece === null, `${id}: tabla de disparo completa (la optativa que cuenta es la suya y la ofrece el registro)`);
    // con el registro real de A: la entrada se arma y sus disparadores salen
    if (O.optativaDeLazo && O.disparadoresDeLazo) {
      const o = O.optativaDeLazo(R);
      c(!!o && o.id === id && o.quien === X.quien && o.premio?.lazos?.[X.quien] === 1, `${id}: optativaDeLazo la arma (con el +1 de respaldo)`);
      const ds = O.disparadoresDeLazo(R);
      c(Object.keys(ds).length === R.disparo.length && Object.keys(ds)[0] === id, `${id}: disparadoresDeLazo da un disparador por disparo, el primero con el id de la escena`);
      c(!o || o.disparadores.join() === Object.keys(ds).join(), `${id}: los disparadores del registro son los de disparadoresDeLazo`);
      if (ofr.escenas?.length) c(Object.values(ds).every((x) => ofr.escenas.every((e) => x.requiere?.includes(e))), `${id}: todos sus disparadores piden la escena que la ofrece`);
      // que la ofrezca el registro sólo con lo que pide
      if (o) {
        const sBase = { escenas: new Set(), temas: new Set(), pobladores: new Set(), trato: null };
        const sMal = o.ofrece(sBase), sBien = o.ofrece({ ...sBase, escenas: new Set(ofr.escenas || []), pobladores: new Set(ofr.pobladores || []) });
        c(sMal === false && sBien === true, `${id}: sólo se ofrece con ${[...(ofr.escenas || []), ...(ofr.pobladores || [])].join(' y ')}`);
      }
    }
  }
  c(ME.OPTATIVA_BELISARIO?.ofrece?.escenas?.join() === 'los-del-cerro' && !ME.OPTATIVA_BELISARIO?.ofrece?.pobladores, 'Belisario: se ofrece con «Los del cerro» vista');
  c(ME.OPTATIVA_SOFIA_FRENTE?.ofrece?.escenas?.join() === 'foto-valle' && ME.OPTATIVA_SOFIA_FRENTE?.ofrece?.pobladores?.join() === 'fotografa', 'Sofía: se ofrece con «La luz de las cinco» vista y viviendo en la aldea');
  c(Object.keys(DIS).join() === 'foto-valle,ultimo-cruce,del-otro-lado', 'la tabla de disparo tiene las tres escenas y nada más');
  c(!ME.OPTATIVA_BELISARIO || ME.OPTATIVA_BELISARIO.disparo.length === 1 && ME.OPTATIVA_BELISARIO.disparo[0].modo === 'hablar', 'Belisario: sólo la E sobre él (en el Puesto del Paso nada se dispara por llegar: ahí ya pasan otras cosas)');
  c(!ME.OPTATIVA_SOFIA_FRENTE || ME.OPTATIVA_SOFIA_FRENTE.disparo.map((x) => x.modo).join() === 'auto,hablar', 'Sofía: llegar al estudio y la E sobre ella, como «La luz de las cinco»');

  // 10) el final: las líneas de 3 de Belisario y Sofía (primero), las dos de Nicanor (una por final)
  const fin = TEX.final || {};
  const cota = cotas(TODAS);
  const cotaSin = (id) => cotas(Object.fromEntries(Object.entries(TODAS).filter(([k]) => k !== id)));
  c(fin.belisario?.length === 2 && fin.belisario[0].id === 'final-belisario-casa' && fin.belisario[0].min === 3 && fin.belisario[1].id === 'final-belisario' && fin.belisario[1].min === 2, 'final de Belisario: primero la de 3 y después la de 2');
  c(fin.sofia?.length === 2 && fin.sofia[0].id === 'final-sofia-casa' && fin.sofia[0].min === 3 && fin.sofia[1].id === 'final-sofia' && fin.sofia[1].min === 2, 'final de Sofía: primero la de 3 y después la de 2');
  c(fin.nicanor?.length === 2 && fin.nicanor[0].id === 'final-nicanor' && fin.nicanor[0].solo === 'trato' && fin.nicanor[0].min === 3 && fin.nicanor[1].id === 'final-nicanor-pelea' && fin.nicanor[1].solo === 'pelea' && fin.nicanor[1].min === 3, 'final de Nicanor: una línea para el trato y otra para la pelea, las dos de 3');
  c(Object.entries(fin).every(([q, l]) => (Array.isArray(l) ? l : []).every((x) => (x.solo === undefined) === (q !== 'nicanor'))), '`solo` es sólo de Nicanor');
  c(Object.values(fin).flat().every((x) => (x.min === undefined) !== (x.max === undefined) && Object.keys(x).every((k) => ['id', 'min', 'max', 'solo', 'texto'].includes(k))), 'final: cada línea pide un mínimo o un máximo (uno solo) y sólo trae id, min, max, solo y texto');
  c((cota.arriba.belisario || 0) >= 3 && (cota.arriba.sofia || 0) >= 3,`cota: con las escenas nuevas Belisario y Sofía llegan a 3 (${cota.arriba.belisario}, ${cota.arriba.sofia})`);
  c((cotaSin('ultimo-cruce').arriba.belisario || 0) === 2 && (cotaSin('del-otro-lado').arriba.sofia || 0) === 2, 'cota: sin su escena nueva, Belisario y Sofía se quedan en 2 (el 3 sale de la escena nueva y de ninguna otra cosa)');
  c(cota.primera.belisario === 8 && cota.primera.sofia === 7, `cota: las escenas viejas de ellos siguen donde estaban (Belisario ${cota.primera.belisario}, Sofía ${cota.primera.sofia})`);
  c((cota.arriba.belisario || 0) <= 3 + 1 && (cota.arriba.sofia || 0) <= 3 + 1, 'cota: ninguno de los dos pasa de 4 (y el tope del lazo es 3)');
  c(sumasDeEscena(U).mejor.belisario === 1 && sumasDeEscena(U).peor.belisario === 1 && sumasDeEscena(D).mejor.sofia === 1 && sumasDeEscena(D).peor.sofia === 1, 'cada escena nueva da exactamente +1 por cualquier camino (no vale más de uno)');
  const cuenta = (q, o) => Object.values(o).filter((v) => v === q).length;
  if (typeof MT.finalDeLazos === 'function') {
    const L = (o) => (q) => o[q] ?? 0;
    const tx = (q, id) => fin[q]?.find((x) => x.id === id)?.texto;
    const base = { rosa: 0, tito: 0, tobias: 0, herminia: 0, nicanor: 0, belisario: 0, sofia: 0 };
    const solo = (q, n, final) => MT.finalDeLazos(L({ ...base, [q]: n }), final);
    c(solo('belisario', 3, 'trato').join() === tx('belisario', 'final-belisario-casa') && solo('belisario', 3, 'pelea').join() === tx('belisario', 'final-belisario-casa'), 'finalDeLazos: Belisario con 3, la de 3 (con los dos finales)');
    c(solo('belisario', 2, 'trato').join() === tx('belisario', 'final-belisario') && solo('belisario', 1, 'trato').length === 0, 'finalDeLazos: Belisario con 2, la de 2; con 1, ninguna');
    c(solo('sofia', 3, 'pelea').join() === tx('sofia', 'final-sofia-casa') && solo('sofia', 2, 'pelea').join() === tx('sofia', 'final-sofia') && solo('sofia', 1, 'pelea').length === 0, 'finalDeLazos: Sofía con 3, la de 3; con 2, la de 2; con 1, ninguna');
    c(solo('nicanor', 3, 'trato').join() === tx('nicanor', 'final-nicanor'), 'finalDeLazos: Nicanor con el trato, la de las luces que vuelven');
    c(solo('nicanor', 3, 'pelea').join() === tx('nicanor', 'final-nicanor-pelea'), 'finalDeLazos: Nicanor con la pelea, la del lago sin luces (y no la del trato)');
    for (const raro of [undefined, null, '', 'fuerte', 'Trato', 7, {}, ['trato']]) c(solo('nicanor', 3, raro).length === 0, `finalDeLazos: con el final «${String(raro)}» ninguna línea de Nicanor (mejor ninguna que la que no es)`);
    c(solo('nicanor', 2, 'trato').length === 0 && solo('nicanor', 2, 'pelea').length === 0 && solo('tito', 0, 'trato').length === 0 && solo('tito', 2, 'trato').length === 0, 'finalDeLazos: Nicanor con 2, ninguna (y Tito con 0 o 2, tampoco: el máximo de la tirante manda)');
    c(MT.finalDeLazos(L({ ...base, rosa: 3 })).join() === tx('rosa', 'final-rosa') && MT.finalDeLazos(L({ ...base, tito: -1 })).join() === tx('tito', 'final-tito-tirante'), 'finalDeLazos: los que no tienen `solo` salen sin decir el final');
    const todos = MT.finalDeLazos(L({ rosa: 3, tito: 3, tobias: 3, herminia: 3, nicanor: 3, belisario: 3, sofia: 3 }), 'trato');
    const todosP = MT.finalDeLazos(L({ rosa: 3, tito: 3, tobias: 3, herminia: 3, nicanor: 3, belisario: 3, sofia: 3 }), 'pelea');
    c(todos.length === 7 && todosP.length === 7 && todos.filter((t, i) => todosP[i] !== t).length === 1, 'finalDeLazos: los siete, y de un final al otro sólo cambia la línea de Nicanor');
    c(todos.join('|') === ['final-rosa', 'final-tito', 'final-tobias', 'final-herminia', 'final-nicanor', 'final-belisario-casa', 'final-sofia-casa'].map((id) => Object.values(fin).flat().find((x) => x.id === id)?.texto).join('|'), 'finalDeLazos: los siete, en el orden fijo y con las líneas de 3');
    c(MT.finalDeLazos().length === 0 && MT.finalDeLazos(null, 'trato').length === 0 && MT.finalDeLazos(() => NaN, 'pelea').length === 0, 'finalDeLazos: sin función o con basura no rompe ni inventa');
  }
  // nada repetido: ninguna frase de cinco palabras compartida entre las líneas de final, las charlas y las piezas del final del juego
  {
    const lineasF = Object.values(fin).flat().map((x) => ({ id: x.id, t: x.texto }));
    const lineasC = Object.values(TEX.charlas || {}).flat().map((x) => ({ id: x.id, t: x.texto }));
    const piezas = [...(O.FINAL_A || []), ...(O.FINAL_B || []), ...Object.values(O.PIEZAS_FINAL || {})].map((t, i) => ({ id: 'pieza' + i, t }));
    const todas = [...lineasF, ...lineasC, ...piezas];
    for (let i = 0; i < todas.length; i++) for (let j = i + 1; j < todas.length; j++) {
      if (todas[i].id === 'final-nicanor' && todas[j].id === 'final-nicanor-pelea') continue;   // (son una por final: no salen juntas)
      const a = ids5(todas[i].t), b = ids5(todas[j].t);
      const comun = [...a].filter((x) => b.has(x));
      c(comun.length === 0, `repetido: «${todas[i].id}» y «${todas[j].id}» comparten «${comun[0]}»`);
    }
    c(piezas.length === 0 || piezas.length >= 8, 'las piezas del final del juego están a la vista de la prueba');
  }

  // 11) la charla de después de cada escena
  const ch = TEX.charlas || {};
  const nuevas = Object.entries(ch).flatMap(([q, l]) => (Array.isArray(l) ? l.map((x) => ({ ...x, quien: q })) : [])).filter((x) => NUEVAS.includes(x.cuando?.escena));
  c(nuevas.length === 2 && nuevas.map((x) => x.id).sort().join() === 'belisario-opt-cruce,sofia-opt-frente', 'charlas de después: la de Belisario y la de Sofía');
  const todasCh = Object.values(ch).flat();
  c(new Set(todasCh.map((x) => x.id)).size === todasCh.length && todasCh.every((x) => !CHARLA_PREVIA.some((y) => y.id === x.id) && !Object.values(fin).flat().some((y) => y.id === x.id)), 'charlas: ids repetidos');
  c(new Set(todasCh.map((x) => x.texto)).size === todasCh.length && todasCh.every((x) => !CHARLA_PREVIA.some((y) => y.texto === x.texto)), 'charlas: texto repetido');
  for (const x of nuevas) {
    const X = Object.values(ESPERADO).find((e) => ESC[x.cuando.escena] && e.quien === x.quien);
    c(typeof x.texto === 'string' && x.texto.length > 60 && x.texto.length <= MAX_LINEA && x.cap === 9 && Object.keys(x.cuando).join() === 'escena', `charla ${x.id}: inválida (texto, capítulo 9, sólo la escena)`);
    c(ESPERADO[x.cuando.escena]?.quien === x.quien, `charla ${x.id}: la dice ${x.quien}, que es el de la escena «${x.cuando.escena}»`);
    c(!!X, `charla ${x.id}: sin su escena`);
  }
  c(['belisario', 'sofia'].every((q) => (ch[q] || []).filter((l) => l.cuando?.lazo?.min !== undefined).length === 1), 'charlas: sigue una sola línea de lazo alto por vecino');
  c((ch.sofia || []).filter((l) => l.cuando?.escena).length === 2 && (ch.belisario || []).filter((l) => l.cuando?.escena).length === 1, 'charlas: Sofía tiene la de «La luz de las cinco» y la nueva; Belisario la nueva');

  // 12) las escenas corren por todos los caminos, se saltan, y dejan exactamente su +1
  for (const [id, e] of Object.entries(ESC)) {
    const X = ESPERADO[id];
    for (const decisiones of id === 'ultimo-cruce' ? [{}, { majada: 'a' }, { majada: 'b' }, { majada: 'c' }] : [{}]) {
      const cs = caminos(e, EFS, { decisiones });
      c(cs.filter(({ script, r }) => script.length === 2 && r.elecciones.length === 2).length === 9, `${id}: tiene que haber 9 caminos de elección completos (3 x 3)`);
      for (const { script, r } of cs) {
        const rot = `${id} ${JSON.stringify(decisiones)} [${script.join(',')}]`;
        c(!r.falloRegistro && !r.noDisparo && r.faltan?.length === 0, `${rot}: registra, dispara y tiene sus efectos`);
        c(!r.activa && r.resultados.length === 1 && r.resultados[0].errores.length === 0, `${rot}: termina sin errores (${r.resultados[0]?.errores?.join('; ')})`);
        c(r.dir.vista(id) && r.mundo.empezo === 1 && r.mundo.termino === 1, `${rot}: queda vista, empieza y termina una vez`);
        c(Object.values(r.mundo.actores).every((a) => !a.capt), `${rot}: suelta a todos`);
        c(r.camaras > 6 && r.lineas.length >= 8, `${rot}: cámara y líneas`);
        const lazos = r.corridos.filter((x) => x.nombre.startsWith('lazo:')).map((x) => x.nombre);
        c(lazos.length === 1 && lazos[0] === X.lazo, `${rot}: suma una sola vez el +1 de ${X.quien}: ${lazos.join(',')}`);
        c(r.corridos.some((x) => x.nombre === X.raro), `${rot}: anota lo raro`);
        c(r.corridos.length === 2, `${rot}: no hace nada más que el lazo y lo raro (${r.corridos.map((x) => x.nombre).join(',')})`);
        c(r.mundo.horas.length === 0, `${rot}: no toca la hora`);
        c(r.hablantes.every((q) => q === X.quien || q === 'narra'), `${rot}: sólo hablan ${X.quien} y la narración`);
      }
    }
    for (const cuando of [2, 40, 300, 1500]) {
      const r = correrEscena(e, EFS, { saltarAl: cuando });
      c(!r.activa && r.dir.vista(id) && r.resultados.length === 1 && r.resultados[0].errores.length === 0, `${id}: se salta a los ${cuando} cuadros`);
      if (cuando >= 40) c(r.corridos.some((x) => x.nombre === X.lazo) && r.corridos.some((x) => x.nombre === X.raro), `${id}: saltada a los ${cuando} cuadros igual da el +1 y lo raro`);
    }
  }

  // 13) lo que cada escena tiene que contar
  const nombres = (r) => (r.corridos || []).map((x) => x.nombre);
  {
    const sin = correrEscena(U, EFS, { decisiones: {} }), con = correrEscena(U, EFS, { decisiones: { majada: 'c' } });
    const dice = (r, re) => (r.lineas || []).some((l) => re.test(l));
    c(dice(con, /ovejas de Ramón llegaron enteras/) && !dice(sin, /ovejas de Ramón llegaron enteras/) && !dice(correrEscena(U, EFS, { decisiones: { majada: 'a' } }), /ovejas de Ramón/), 'ultimo-cruce: lo de las ovejas de Ramón sólo se dice si se la vendiste (majada = c)');
    c(dice(sin, /última tropa/) && dice(sin, /huella la abrió mi padre/) && dice(sin, /lo paga el camino/) && dice(sin, /Las mulas saludan a quien ven/), 'ultimo-cruce: la tropa, la huella del padre, el mate y las mulas que saludan');
    c(dice(correrEscena(U, EFS, { script: [0, 0] }), /llevarlo de la rienda/) && dice(correrEscena(U, EFS, { script: [1, 0] }), /perro que se llamaba Mate/) && dice(correrEscena(U, EFS, { script: [2, 0] }), /necesito horizonte/), 'ultimo-cruce: cada pregunta tiene su respuesta');
    c(dice(correrEscena(U, EFS, { script: [0, 0] }), /Lindo y largo/) && dice(correrEscena(U, EFS, { script: [0, 1] }), /me acostumbro/) && dice(correrEscena(U, EFS, { script: [0, 2] }), /no en castellano/), 'ultimo-cruce: cada despedida tiene su respuesta');
    c(lineasDeDialogo(U).some((t) => /huellas muy chicas, descalzas/.test(t)) && lineasDeDialogo(U).some((t) => /siete mulas/.test(t)), 'ultimo-cruce: las siete mulas y las huellas chicas descalzas');
    c(lineasDeDialogo(U).some((t) => /pipa/.test(t)), 'ultimo-cruce: la pipa de la vía (la de «Las perdidas»)');
    const a = correrEscena(D, EFS, { script: [0, 0] }), b = correrEscena(D, EFS, { script: [1, 1] }), d = correrEscena(D, EFS, { script: [2, 2] });
    c(dice(a, /se vea dónde vivo/) && dice(b, /cada arruga/) && dice(d, /el valle hace de telón/), 'del-otro-lado: cada encuadre tiene su respuesta');
    c(dice(a, /cajón, sí/) && dice(b, /con mano y todo/) && dice(d, /buen asistente, el viento/), 'del-otro-lado: cada destino de la mano tiene su respuesta');
    c(dice(a, /Salí riéndome/) && dice(a, /Es el viento/) && dice(a, /cajón entero de cosas que no explico/) && dice(a, /vas del otro lado/), 'del-otro-lado: la risa, el viento y el cajón de las cosas que no explica');
    c(lineasDeDialogo(D).some((t) => /mano muy chica/.test(t)) && lineasDeDialogo(D).some((t) => /reflector/.test(t)), 'del-otro-lado: el reflector y la mano chica que lo sostiene');
    c(nombres(a).join() === `${ESPERADO['del-otro-lado'].lazo},${ESPERADO['del-otro-lado'].raro}` && nombres(correrEscena(U, EFS, { script: [1, 2] })).join() === `${ESPERADO['ultimo-cruce'].lazo},${ESPERADO['ultimo-cruce'].raro}`, 'los efectos salen en orden: primero el lazo y después lo raro');
  }

  // 14) el código: reglas del empaquetador (armar.mjs) y de módulo puro
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
  c(!/from '\.\/historia(?:-optativas|-disparadores[a-z0-9-]*)?\.js'/.test(textoE), `${ARCH_ESC}: no importa el registro ni el motor de la historia (lo importa el registro: sin ciclos)`);
  const mios = [...(textoE + '\n' + textoT).matchAll(/^export\s+(?:const|function)\s+([A-Za-z0-9_$]+)/gm)].map((m) => m[1]);
  c(new Set(mios).size === mios.length, 'los nombres exportados se repiten entre los dos archivos');
  for (const x of ['ESCENAS_LAZOS', 'IDS_LAZOS', 'EFECTOS_LAZOS', 'DISPARO_LAZOS', 'POR_DEFECTO_LAZOS', 'OPTATIVA_BELISARIO', 'OPTATIVA_SOFIA_FRENTE', 'OPTATIVAS_LAZOS']) c(new RegExp(`^export const ${x} =`, 'm').test(textoE), `${ARCH_ESC}: falta el export «${x}»`);
  for (const x of ['TEXTO_LAZOS', 'VECINOS_LAZO', 'lazoCumple', 'finalDeLazos', 'fraseDeGuia']) c(new RegExp(`^export (?:const|function) ${x}\\b`, 'm').test(textoT), `${ARCH_TEX}: falta el export «${x}»`);
  c(/^export function finalDeLazos\(lazoDe, final\)/m.test(textoT), `${ARCH_TEX}: la firma es finalDeLazos(lazoDe, final) (la que se le pidió a A en el tablero)`);
  return f;
}

// ---------------------------------------------------------------- los datos reales
const ruta = (dir, arch) => pathToFileURL(join(dir, arch.replace('src/', ''))).href;
let version = 0;
const O = {};
{
  const RO = await import('../src/historia-optativas.js'), DO = await import('../src/historia-disparadores-optativas.js'), HF = await import('../src/historia-final.js');
  O.optativaDeLazo = RO.optativaDeLazo; O.disparadoresDeLazo = DO.disparadoresDeLazo; O.FINAL_A = HF.FINAL_A; O.FINAL_B = HF.FINAL_B; O.PIEZAS_FINAL = HF.PIEZAS_FINAL;
}
async function cargar(dir) {
  version++;
  const ME = await import(ruta(dir, ARCH_ESC) + '?v=' + version);
  const MT = await import(ruta(dir, ARCH_TEX) + '?v=' + version);
  return { ME, MT, textoE: readFileSync(join(dir, ARCH_ESC.replace('src/', '')), 'utf8'), textoT: readFileSync(join(dir, ARCH_TEX.replace('src/', '')), 'utf8') };
}
const real = await cargar(join(raiz, 'src'));
const reales = todo(real.ME, real.MT, real.textoE, real.textoT, O);
ok(reales.length === 0, 'la suite pasa sobre los datos reales: ' + reales.slice(0, 15).join(' | ') + (reales.length > 15 ? ` (+${reales.length - 15})` : ''));

// las dos medidas a la vista: Belisario y Sofía llegan a 3 con la escena nueva, y sólo con ella
{
  const k = cotas(real.ME.ESCENAS_LAZOS);
  ok(k.arriba.belisario === 3 && k.arriba.sofia === 3, `cota: Belisario 3 y Sofía 3 (${k.arriba.belisario}, ${k.arriba.sofia})`);
  ok(['rosa', 'tito', 'tobias', 'herminia', 'nicanor'].every((q) => k.arriba[q] >= 3), 'cota: los otros cinco siguen llegando a 3');
  ok(Object.keys(k.abajo).filter((q) => VECINOS.includes(q)).join() === 'tito', 'cota: de los siete, el único que puede quedar tirante sigue siendo Tito');
}

// CAMBIOS_4_19_0_B.md y verify:pasos
{
  const cambios = existsSync(join(raiz, 'CAMBIOS_4_19_0_B.md')) ? leer('CAMBIOS_4_19_0_B.md') : '';
  ok(cambios.length > 3000, 'existe CAMBIOS_4_19_0_B.md');
  for (const x of ['ultimo-cruce', 'del-otro-lado', 'OPTATIVAS_LAZOS', 'OPTATIVA_BELISARIO', 'OPTATIVA_SOFIA_FRENTE', 'finalDeLazos', 'solo', 'trato', 'pelea', 'foto-sofia', 'lazo:belisario:1', 'lazo:sofia:1', 'mulas-saludan', 'foto-de-sofia', 'belisario-opt-cruce', 'sofia-opt-frente', 'final-nicanor-pelea', 'final-belisario-casa', 'final-sofia-casa', 'se vio a ojo', 'verificar-4-18-2-lazos-escenas']) ok(cambios.includes(x), `CAMBIOS_4_19_0_B.md explica «${x}»`);
  ok(!/scratch/i.test(cambios) && !INGLES.test(cambios.replace(/`[^`]*`/g, '')), 'los cambios, en castellano y sin mencionar lo que no se menciona');
  const pkg = JSON.parse(leer('package.json'));
  ok(/node pruebas\/verificar-4-19-0-b\.mjs/.test(pkg.scripts?.['verify:pasos'] || ''), 'la prueba está en verify:pasos');
}

// ---------------------------------------------------------------- MUTACIONES de datos: se clona lo exportado y se rompe una garantía
const clon = (o) => JSON.parse(JSON.stringify(o));
function mutanteDatos(tocar) {
  const ME = { ...real.ME, ESCENAS_LAZOS: clon(real.ME.ESCENAS_LAZOS), DISPARO_LAZOS: clon(real.ME.DISPARO_LAZOS), EFECTOS_LAZOS: [...real.ME.EFECTOS_LAZOS], IDS_LAZOS: [...real.ME.IDS_LAZOS], OPTATIVA_BELISARIO: clon(real.ME.OPTATIVA_BELISARIO), OPTATIVA_SOFIA_FRENTE: clon(real.ME.OPTATIVA_SOFIA_FRENTE) };
  ME.OPTATIVAS_LAZOS = [ME.OPTATIVA_BELISARIO, ME.OPTATIVA_SOFIA_FRENTE];
  const MT = { ...real.MT, TEXTO_LAZOS: clon(real.MT.TEXTO_LAZOS) };
  tocar(ME.ESCENAS_LAZOS['ultimo-cruce'], ME.ESCENAS_LAZOS['del-otro-lado'], MT.TEXTO_LAZOS, ME.DISPARO_LAZOS, ME, MT);
  return todo(ME, MT, real.textoE, real.textoT, O);
}
const dial = (e) => e.pasos.find((p) => p.tipo === 'dialogo');
const elec = (e, id) => e.pasos.find((p) => p.tipo === 'eleccion' && p.id === id);
const sinEfecto = (e, nombre) => { e.pasos = e.pasos.filter((p) => !(p.tipo === 'efecto' && p.nombre === nombre)); };
const MUT_DATOS = [
  // las escenas
  ['una escena de más', (u, d, t, dis, ME) => { ME.ESCENAS_LAZOS['extra'] = { ...clon(u), id: 'extra' }; }],
  ['falta una escena', (u, d, t, dis, ME) => { delete ME.ESCENAS_LAZOS['del-otro-lado']; }],
  ['un id que choca con una optativa', (u, d, t, dis, ME) => { const x = ME.ESCENAS_LAZOS['ultimo-cruce']; delete ME.ESCENAS_LAZOS['ultimo-cruce']; ME.ESCENAS_LAZOS['vuelta-faro'] = { ...x, id: 'vuelta-faro' }; }],
  ['el id no coincide con la clave', (u) => { u.id = 'ultimo-paso'; }],
  ['acto mal puesto', (u) => { u.acto = 2; }],
  ['capítulo mal puesto', (u, d) => { d.capitulo = 12; }],
  ['un plano desconocido', (u) => { u.pasos.find((p) => p.tipo === 'plano').plano = 'cenital'; }],
  ['pocos planos', (u) => { const pl = u.pasos.filter((p) => p.tipo === 'plano'); u.pasos = u.pasos.filter((p) => !pl.slice(2).includes(p)); }],
  ['una escena sin resumen', (u) => { delete u.resumen; }],
  ['una escena efímera', (u, d) => { d.efimera = true; }],
  ['Sofía sin el clac ni el fundido', (u, d) => { d.pasos = d.pasos.filter((p) => p.tipo !== 'fundido'); }],
  ['Belisario con un fundido y un cambio de hora', (u) => { u.pasos.splice(3, 0, { tipo: 'hora', a: 12, dur: 1 }); }],
  ['Sofía cambia la hora', (u, d) => { d.pasos.splice(3, 0, { tipo: 'hora', mas: 1, dur: 1 }); }],
  // las elecciones
  ['una opción con peso (Belisario)', (u) => { const o = elec(u, 'cruce-pregunta').opciones[0]; o.efecto = 'lazo:belisario:1'; delete o.sabor; }],
  ['una opción con peso (Sofía)', (u, d) => { const o = elec(d, 'otro-encuadre').opciones[1]; o.efecto = 'lazo:sofia:1'; delete o.sabor; }],
  ['una opción sin sabor', (u) => { delete elec(u, 'cruce-despedida').opciones[0].sabor; }],
  ['cuatro opciones', (u) => { elec(u, 'cruce-pregunta').opciones.push({ id: 'otra', texto: 'Otra.', sabor: true }); }],
  ['dos opciones', (u, d) => { elec(d, 'otra-mano').opciones.pop(); }],
  ['una elección repetida con un acto', (u) => { elec(u, 'cruce-pregunta').id = 'mirador-graciela'; }],
  ['una elección repetida con foto-valle', (u, d) => { elec(d, 'otra-mano').id = 'valle-copia'; }],
  ['una elección repetida entre las dos escenas', (u, d) => { elec(d, 'otro-encuadre').id = 'cruce-pregunta'; }],
  ['una opción sin respuesta', (u) => { u.pasos = u.pasos.filter((p) => !(p.si?.eleccion === 'cruce-despedida' && p.si.es === 'mulas')); }],
  ['una respuesta sin la opción', (u, d) => { elec(d, 'otra-mano').opciones.pop(); elec(d, 'otra-mano').opciones.push({ id: 'otra', texto: 'Otra cosa.', sabor: true }); }],
  ['una pregunta larga', (u) => { elec(u, 'cruce-pregunta').pregunta = '¿Qué le preguntás a Belisario antes de que se vaya con la tropa por el paso?'; }],
  ['una opción larguísima', (u) => { elec(u, 'cruce-despedida').opciones[0].texto = 'Que le vaya lindo, Belisario, y que las mulas lo cuiden mucho en el camino de ida y de vuelta, con nieve o sin ella.'; }],
  ['un porDefecto fuera de rango', (u) => { elec(u, 'cruce-pregunta').porDefecto = 5; }],
  ['un paso que mira una elección inexistente', (u) => { u.pasos.push({ tipo: 'dialogo', quien: 'narra', lineas: ['Hola, hola.'], si: { eleccion: 'no-hay', es: 'a' } }); }],
  // lo que dan
  ['Belisario da +2', (u, d, t, dis, ME) => { u.pasos.find((p) => p.nombre === 'lazo:belisario:1').nombre = 'lazo:belisario:2'; ME.EFECTOS_LAZOS = ME.EFECTOS_LAZOS.map((x) => (x === 'lazo:belisario:1' ? 'lazo:belisario:2' : x)); }],
  ['Sofía da +1 dos veces', (u, d) => { d.pasos.splice(d.pasos.length - 1, 0, { tipo: 'efecto', nombre: 'lazo:sofia:1' }); }],
  ['el +1 de Sofía a Belisario', (u, d, t, dis, ME) => { d.pasos.find((p) => p.nombre === 'lazo:sofia:1').nombre = 'lazo:belisario:1'; }],
  ['sin el lazo de Belisario', (u) => { sinEfecto(u, 'lazo:belisario:1'); }],
  ['sin el lazo de Sofía', (u, d, t, dis, ME) => { sinEfecto(d, 'lazo:sofia:1'); }],
  ['sin el raro de las mulas', (u) => { sinEfecto(u, 'raro:mulas-saludan'); }],
  ['sin el raro de la foto', (u, d) => { sinEfecto(d, 'raro:foto-de-sofia'); }],
  ['el lazo después del raro', (u) => { const i = u.pasos.findIndex((p) => p.nombre === 'lazo:belisario:1'); const [x] = u.pasos.splice(i, 1); u.pasos.push(x); }],
  ['la escena mueve a otro vecino', (u, d, t, dis, ME) => { u.pasos.push({ tipo: 'efecto', nombre: 'lazo:ramon:1' }); ME.EFECTOS_LAZOS.push('lazo:ramon:1'); ME.EFECTOS_LAZOS.sort(); }],
  ['la escena da un objeto', (u, d, t, dis, ME) => { d.pasos.push({ tipo: 'efecto', nombre: 'dar:pan-casero:1' }); ME.EFECTOS_LAZOS.push('dar:pan-casero:1'); ME.EFECTOS_LAZOS.sort(); }],
  ['la escena da plata', (u, d, t, dis, ME) => { u.pasos.push({ tipo: 'efecto', nombre: 'mundo:pesos' }); ME.EFECTOS_LAZOS.push('mundo:pesos'); ME.EFECTOS_LAZOS.sort(); }],
  ['un efecto fuera de la convención', (u) => { u.pasos.push({ tipo: 'efecto', nombre: 'regalo:foto' }); }],
  ['EFECTOS desactualizado', (u, d, t, dis, ME) => { ME.EFECTOS_LAZOS = ME.EFECTOS_LAZOS.filter((x) => x !== 'raro:mulas-saludan'); }],
  ['una condición fuera de la convención', (u) => { u.pasos.push({ tipo: 'dialogo', quien: 'narra', lineas: ['Hola, hola.'], si: { cond: 'magia', args: {} } }); }],
  ['una condición de lazo (no permitida acá)', (u) => { u.pasos.push({ tipo: 'dialogo', quien: 'narra', lineas: ['Hola, hola.'], si: { cond: 'lazo', args: { quien: 'belisario', min: 1 } } }); }],
  ['otra decisión distinta de la majada vendida', (u) => { u.pasos.find((p) => p.si?.cond === 'decision').si.args.es = 'a'; }],
  ['sin la variante de la majada', (u) => { u.pasos = u.pasos.filter((p) => p.si?.cond !== 'decision'); }],
  ['la variante de la majada para todos', (u) => { delete u.pasos.find((p) => p.si?.cond === 'decision').si; }],
  // textos
  ['una línea larguísima', (u) => { dial(u).lineas.push('Larguísimo. '.repeat(30)); }],
  ['una narración larguísima', (u, d) => { d.pasos.find((p) => p.quien === 'narra').lineas.push('Muy largo, muy largo. '.repeat(25)); }],
  ['inglés', (u) => { dial(u).lineas.push('Una frase with algo raro.'); }],
  ['religión', (u) => { dial(u).lineas.push('Gracias a Dios llegamos al paso.'); }],
  ['algo explícito', (u, d) => { dial(d).lineas.push('Se dieron un beso largo.'); }],
  ['algo que no existe en el juego', (u) => { dial(u).lineas.push('Mañana vuelvo al hospedaje.'); }],
  ['un número a la vista', (u) => { dial(u).lineas.push('Belisario suma 1 punto de lazo.'); }],
  ['una persona que no existe', (u) => { dial(u).lineas.push('Me lo dijo la tía Hortensia.'); }],
  ['un hablante sin declarar', (u) => { dial(u).quien = 'belisarito'; }],
  ['habla otra persona', (u) => { u.personajes.tito = { clave: 'carpintero', nombre: 'Tito', color: '#b98a5c' }; dial(u).quien = 'tito'; }],
  ['Belisario con otra clave', (u) => { u.personajes.belisario.clave = 'arriero'; }],
  ['Sofía con otra clave', (u, d) => { d.personajes.sofia.clave = 'fotografa2'; }],
  ['una pose que no existe', (u) => { u.pasos.push({ tipo: 'gesto', quien: 'belisario', accion: 'posar', pose: 'volar' }); }],
  ['un lugar que no existe', (u) => { u.pasos.find((p) => p.tipo === 'plano').a = { lugar: 'aeropuerto' }; }],
  ['sin las huellas chicas', (u) => { u.pasos = u.pasos.filter((p) => !(p.tipo === 'dialogo' && p.lineas.some((l) => /huellas muy chicas/.test(typeof l === 'string' ? l : l.texto)))); }],
  ['sin la mano chica', (u, d) => { d.pasos = d.pasos.filter((p) => !(p.tipo === 'dialogo' && p.lineas.some((l) => /mano muy chica/.test(typeof l === 'string' ? l : l.texto)))); }],
  ['sin la pipa', (u) => { u.pasos = u.pasos.filter((p) => !(p.tipo === 'dialogo' && p.lineas.some((l) => /pipa/.test(typeof l === 'string' ? l : l.texto)))); }],
  ['sin la risa de Sofía', (u, d) => { d.pasos = d.pasos.filter((p) => !(p.tipo === 'dialogo' && p.lineas.some((l) => /Salí riéndome/.test(typeof l === 'string' ? l : l.texto)))); }],
  // raro
  ['un raro sin texto', (u, d, t) => { t.raro['mulas-saludan'].texto = ''; }],
  ['un raro de otro capítulo', (u, d, t) => { t.raro['foto-de-sofia'].cap = 7; }],
  ['un raro con otro lugar', (u, d, t) => { t.raro['mulas-saludan'].donde = 'galpón'; }],
  ['un raro huérfano', (u, d, t) => { t.raro['suelto'] = { titulo: 'Suelto', texto: 'Esto no lo anota ninguna escena y es un texto bastante largo para pasar el mínimo.', cap: 9, donde: 'valle' }; }],
  ['un raro que choca con los actos', (u, d, t) => { t.raro['foto-ojo'] = t.raro['foto-de-sofia']; delete t.raro['foto-de-sofia']; }],
  ['un raro que no habla de las huellas', (u, d, t) => { t.raro['mulas-saludan'].texto = 'En el Puesto del Paso, las siete mulas de Belisario miraron hacia el valle a la vez, con las orejas para adelante, y después siguieron comiendo.'; }],
  // tablón
  ['sin el tablón de Belisario', (u, d, t) => { delete t.tablon['ultimo-cruce']; }],
  ['el tablón con otro vecino', (u, d, t) => { t.tablon['del-otro-lado'].quien = 'belisario'; }],
  ['el tablón con capítulos que no son los de la ventana', (u, d, t) => { t.tablon['ultimo-cruce'].caps = [9, 10]; }],
  ['el tablón con capítulos salteados', (u, d, t) => { t.tablon['del-otro-lado'].caps = [9, 11]; }],
  ['el tablón que arranca antes de la escena', (u, d, t) => { t.tablon['del-otro-lado'].caps = [8, 9, 10, 11]; }],
  ['el tablón sin línea de hecha', (u, d, t) => { delete t.tablon['ultimo-cruce'].hecha; }],
  ['el tablón con la misma línea abierta y hecha', (u, d, t) => { t.tablon['del-otro-lado'].hecha = t.tablon['del-otro-lado'].ofrecida; }],
  ['el tablón con el mismo título', (u, d, t) => { t.tablon['del-otro-lado'].titulo = t.tablon['ultimo-cruce'].titulo; }],
  // registro y disparo
  ['el registro sin la ventana', (u, d, t, dis, ME) => { delete ME.OPTATIVA_BELISARIO.hasta; }],
  ['la ventana al revés', (u, d, t, dis, ME) => { ME.OPTATIVA_SOFIA_FRENTE.desde = 'arco'; ME.OPTATIVA_SOFIA_FRENTE.hasta = 'frios'; }],
  ['la ventana que cruza de acto', (u, d, t, dis, ME) => { ME.OPTATIVA_BELISARIO.hasta = 'deshielo'; ME.OPTATIVA_BELISARIO.desde = 'cuaderno'; }],
  ['la ventana que arranca en otro capítulo', (u, d, t, dis, ME) => { ME.OPTATIVA_SOFIA_FRENTE.desde = 'golpea'; }],
  ['un capítulo que no existe', (u, d, t, dis, ME) => { ME.OPTATIVA_BELISARIO.hasta = 'primavera'; }],
  ['el registro con otro id', (u, d, t, dis, ME) => { ME.OPTATIVA_BELISARIO.id = 'ultimo-paso'; }],
  ['el registro con otra escena', (u, d, t, dis, ME) => { ME.OPTATIVA_SOFIA_FRENTE.escena = 'foto-valle'; }],
  ['el registro con otro vecino', (u, d, t, dis, ME) => { ME.OPTATIVA_BELISARIO.quien = 'sofia'; }],
  ['ofrece con una escena que no existe', (u, d, t, dis, ME) => { ME.OPTATIVA_BELISARIO.ofrece.escenas = ['los-de-abajo']; }],
  ['Belisario se ofrece siempre', (u, d, t, dis, ME) => { ME.OPTATIVA_BELISARIO.ofrece = {}; }],
  ['Sofía se ofrece sin foto-valle', (u, d, t, dis, ME) => { ME.OPTATIVA_SOFIA_FRENTE.ofrece = { pobladores: ['fotografa'] }; }],
  ['Sofía se ofrece sin que viva en la aldea', (u, d, t, dis, ME) => { ME.OPTATIVA_SOFIA_FRENTE.ofrece = { escenas: ['foto-valle'] }; }],
  ['ofrece con un poblador que no existe', (u, d, t, dis, ME) => { ME.OPTATIVA_SOFIA_FRENTE.ofrece.pobladores = ['fotografo2']; }],
  ['ofrece con una condición que nadie entiende', (u, d, t, dis, ME) => { ME.OPTATIVA_BELISARIO.ofrece.magia = true; }],
  ['un disparo con un modo que no existe', (u, d, t, dis, ME) => { ME.OPTATIVA_BELISARIO.disparo[0].modo = 'tocar'; }],
  ['hablar con otra persona', (u, d, t, dis, ME) => { ME.OPTATIVA_BELISARIO.disparo[0].clave = 'fermin'; }],
  ['llegar a un lugar que no existe', (u, d, t, dis, ME) => { ME.OPTATIVA_SOFIA_FRENTE.disparo[0].lugar = 'aeropuerto'; }],
  ['llegar con un radio enorme', (u, d, t, dis, ME) => { ME.OPTATIVA_SOFIA_FRENTE.disparo[0].radio = 500; }],
  ['un disparo de noche', (u, d, t, dis, ME) => { ME.OPTATIVA_BELISARIO.disparo[0].hora = [8, 23]; }],
  ['un disparo con la hora al revés', (u, d, t, dis, ME) => { ME.OPTATIVA_SOFIA_FRENTE.disparo[1].hora = [16.5, 9]; }],
  ['Belisario con un disparo por llegar', (u, d, t, dis, ME) => { ME.OPTATIVA_BELISARIO.disparo.push({ modo: 'auto', lugar: 'estudio-fotos', radio: 12, hora: [8, 18] }); }],
  ['Sofía sin el disparo por llegar', (u, d, t, dis, ME) => { ME.OPTATIVA_SOFIA_FRENTE.disparo = ME.OPTATIVA_SOFIA_FRENTE.disparo.slice(1); }],
  ['OPTATIVAS_LAZOS con una sola', (u, d, t, dis, ME) => { ME.OPTATIVAS_LAZOS = [ME.OPTATIVA_BELISARIO]; }],
  ['falta la tabla de disparo', (u, d, t, dis) => { delete dis['ultimo-cruce']; }],
  ['disparo con otro capítulo', (u, d, t, dis) => { dis['del-otro-lado'].cap = 7; }],
  ['disparo con otra optativa', (u, d, t, dis) => { dis['ultimo-cruce'].objetivo = 'mulas'; }],
  ['disparo que dice que la ofrece una escena', (u, d, t, dis) => { dis['del-otro-lado'].ofrece = 'foto-valle'; }],
  ['disparo con el cuándo vacío', (u, d, t, dis) => { dis['ultimo-cruce'].cuando = ''; }],
  // el final
  ['el final de Belisario sin la de 3', (u, d, t) => { t.final.belisario.shift(); }],
  ['el final de Sofía con la de 2 primero', (u, d, t) => { t.final.sofia.reverse(); }],
  ['el final de Belisario pide 4', (u, d, t) => { t.final.belisario[0].min = 4; }],
  ['el final de Sofía de 3 con máximo', (u, d, t) => { t.final.sofia[0].max = 3; }],
  ['el final de Nicanor sin la de la pelea', (u, d, t) => { t.final.nicanor.pop(); }],
  ['el final de Nicanor sin `solo` en el trato', (u, d, t) => { delete t.final.nicanor[0].solo; }],
  ['el final de Nicanor con `solo` cruzado', (u, d, t) => { t.final.nicanor[0].solo = 'pelea'; }],
  ['`solo` en el final de Rosa', (u, d, t) => { t.final.rosa[0].solo = 'trato'; }],
  ['`solo` con un final que no existe', (u, d, t) => { t.final.nicanor[1].solo = 'fuerte'; }],
  ['la de Nicanor para la pelea pide 2', (u, d, t) => { t.final.nicanor[1].min = 2; }],
  ['la de Nicanor para la pelea dice que las luces vuelven', (u, d, t) => { t.final.nicanor[1].texto = 'Cuando las luces vuelven al lago, Nicanor te silba desde el muelle, para tener un testigo. Vos vas.'; }],
  ['el final de 3 de Sofía repite una frase de la de 2', (u, d, t) => { t.final.sofia[0].texto += ' Ella dice que está para el tamaño.'; }],
  ['el final de Rosa repite la charla', (u, d, t) => { t.final.rosa[0].texto = 'Rosa te guarda el primer pan: una hogaza del fondo del horno, la más tostada. Dice que es costumbre.'; }],
  ['el final de Herminia repite a la pelea', (u, d, t) => { t.final.herminia[0].texto = 'Herminia dice que hay que dejar la puerta entornada para los vecinos que se van y a veces vuelven.'; }],
  ['un final de 3 con inglés', (u, d, t) => { t.final.belisario[0].texto = 'Belisario te guarda la primera historia de cada viaje and te la cuenta con el mate todavía caliente, y listo.'; }],
  ['un final de 3 con un número', (u, d, t) => { t.final.sofia[0].texto = 'En el estudio de Sofía hay 3 fotos tuyas, una de ellas riéndose, y el mérito es de la cámara, dice ella.'; }],
  ['un final con un nombre que no existe', (u, d, t) => { t.final.belisario[0].texto = 'Belisario te guarda la primera historia de cada viaje y se la contó antes a la tía Hortensia, que lo espera.'; }],
  ['un final largo', (u, d, t) => { t.final.sofia[0].texto += ' Y además dice cosas largas sobre otras cosas largas de la vida entera.'.repeat(3); }],
  ['un final con el mismo id', (u, d, t) => { t.final.sofia[0].id = 'final-sofia'; }],
  // la charla de después
  ['sin la charla de Belisario', (u, d, t) => { t.charlas.belisario = t.charlas.belisario.filter((l) => l.id !== 'belisario-opt-cruce'); }],
  ['la charla de Sofía antes de su escena', (u, d, t) => { t.charlas.sofia.find((l) => l.id === 'sofia-opt-frente').cap = 7; }],
  ['la charla de Sofía mira otra escena', (u, d, t) => { t.charlas.sofia.find((l) => l.id === 'sofia-opt-frente').cuando.escena = 'foto-sofia'; }],
  ['la charla de Belisario la dice Sofía', (u, d, t) => { t.charlas.sofia.push(t.charlas.belisario.pop()); }],
  ['la charla nueva pide lazo', (u, d, t) => { t.charlas.belisario.find((l) => l.id === 'belisario-opt-cruce').cuando = { lazo: { min: 3 } }; }],
  ['la charla repetida palabra por palabra', (u, d, t) => { t.charlas.sofia.find((l) => l.id === 'sofia-opt-frente').texto = t.charlas.sofia.find((l) => l.id === 'sofia-opt-valle').texto; }],
  ['la charla con id repetido', (u, d, t) => { t.charlas.belisario.find((l) => l.id === 'belisario-opt-cruce').id = 'belisario-opt-zaino'; }],
  ['la charla con un número', (u, d, t) => { t.charlas.sofia.find((l) => l.id === 'sofia-opt-frente').texto = 'Sigo mirando la foto en la que me río, 3 veces por día. Gracias por apretar la pera, che.'; }],
  ['la charla con la palabra lazo', (u, d, t) => { t.charlas.belisario.find((l) => l.id === 'belisario-opt-cruce').texto = 'Ando raro desde que le hablé de mi padre en el paso: entre nosotros hay un lazo nuevo, y es el mate.'; }],
  ['la charla que repite una frase del final', (u, d, t) => { t.charlas.belisario.find((l) => l.id === 'belisario-opt-cruce').texto = 'La primera historia de cada viaje la cuento con el mate todavía caliente. Será que me suelta la lengua.'; }],
  ['una charla vacía', (u, d, t) => { t.charlas.belisario.find((l) => l.id === 'belisario-opt-cruce').texto = 'Hola.'; }],
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
  ['falta el export OPTATIVAS_LAZOS', 'E', (t) => t.replace('export const OPTATIVAS_LAZOS', 'const OPTATIVAS_LAZOS')],
  ['falta el export OPTATIVA_BELISARIO', 'E', (t) => t.replace('export const OPTATIVA_BELISARIO', 'const OPTATIVA_BELISARIO')],
  ['dos exports en una línea', 'E', (t) => t.replace('export const OPTATIVAS_LAZOS = [OPTATIVA_BELISARIO, OPTATIVA_SOFIA_FRENTE];', 'export const OPTATIVAS_LAZOS = [OPTATIVA_BELISARIO, OPTATIVA_SOFIA_FRENTE], OTRO_MAS = 1;')],
  ['un export con ñ', 'T', (t) => t.replace('export function fraseDeGuia(', 'export const fraseDeÑ = 1;\nexport function fraseDeGuia(')],
  ['el registro importa el motor de la historia (ciclo)', 'E', (t) => "import { CAPITULOS } from './historia.js';\n" + t],
  ['el texto importa algo (ciclo posible)', 'T', (t) => "import { lazoDe } from './historia.js';\n" + t],
  ['fines de línea CRLF', 'E', (t) => t.replace(/\n/g, '\r\n')],
  ['un módulo que toca el DOM', 'T', (t) => t + '\nexport const ancho = () => window.innerWidth;\n'],
  ['un id con ñ', 'E', (t) => t.replace("'ultimo-cruce': ultimoCruce,", "'ultimo-cruce': ultimoCruce,\n  'ñandu': { ...ultimoCruce, id: 'ñandu' },")],
  ['EFECTOS fijo en vez de calculado', 'E', (t) => t.replace(/export const EFECTOS_LAZOS = .*$/m, "export const EFECTOS_LAZOS = ['raro:foto-del-valle'];")],
  ['IDS con una escena de más', 'E', (t) => t.replace('export const IDS_LAZOS = Object.keys(ESCENAS_LAZOS);', "export const IDS_LAZOS = [...Object.keys(ESCENAS_LAZOS), 'otra'];")],
  ['Belisario da +2 en el código', 'E', (t) => t.replace("efecto('lazo:belisario:1'),", "efecto('lazo:belisario:2'),")],
  ['Sofía da +2 en el código', 'E', (t) => t.replace("efecto('lazo:sofia:1'),\n    efecto('raro:foto-de-sofia')", "efecto('lazo:sofia:2'),\n    efecto('raro:foto-de-sofia')")],
  ['Belisario da el lazo dos veces', 'E', (t) => t.replace("efecto('lazo:belisario:1'),\n    efecto('raro:mulas-saludan'),", "efecto('lazo:belisario:1'),\n    efecto('lazo:belisario:1'),\n    efecto('raro:mulas-saludan'),")],
  ['una opción de Sofía con peso', 'E', (t) => t.replace("opcion('cerca', 'De cerca, sólo la cara.', { sabor: true })", "opcion('cerca', 'De cerca, sólo la cara.', { efecto: 'lazo:sofia:1' })")],
  ['la escena de Belisario cambia la hora', 'E', (t) => t.replace("narra('Cuando suelta la soga", "hora(12, { dur: 0 }),\n    narra('Cuando suelta la soga")],
  ['la ventana de Belisario cruza de acto', 'E', (t) => t.replace("desde: 'frios', hasta: 'arco', quien: 'belisario'", "desde: 'frios', hasta: 'deshielo', quien: 'belisario'")],
  ['Sofía se ofrece sin foto-valle', 'E', (t) => t.replace("ofrece: { escenas: ['foto-valle'], pobladores: ['fotografa'] }", "ofrece: { pobladores: ['fotografa'] }")],
  ['Belisario se ofrece sin los del cerro', 'E', (t) => t.replace("ofrece: { escenas: ['los-del-cerro'] }", 'ofrece: {}')],
  ['el disparo de Belisario con otra persona', 'E', (t) => t.replace("clave: 'belisario', hora: [8, 18]", "clave: 'fermin', hora: [8, 18]")],
  ['el disparo de Sofía de noche', 'E', (t) => t.replace("{ modo: 'hablar', clave: 'fotografa', hora: [9, 16.5] }],\n};\nexport const OPTATIVAS", "{ modo: 'hablar', clave: 'fotografa', hora: [9, 23] }],\n};\nexport const OPTATIVAS")],
  ['la elección de Belisario sin respuesta', 'E', (t) => t.replace("    dlg('belisario', ['Se lo digo. Contestan, pero no en castellano.'], { si: siEleg('cruce-despedida', 'mulas') }),\n", '')],
  ['la majada vendida para todos', 'E', (t) => t.replace("]), siDecision('majada', 'c')),", ']), siDecision(\'majada\', \'a\')),')],
  ['lazoCumple ignora el máximo', 'T', (t) => t.replace('return v >= min && v <= max;', 'return v >= min;')],
  ['finalDeLazos ignora el final (`solo`)', 'T', (t) => t.replace(' && (x.solo === undefined || x.solo === cual));', ');')],
  ['finalDeLazos con `solo` que acepta cualquier final', 'T', (t) => t.replace('(x.solo === undefined || x.solo === cual)', '(x.solo === undefined || cual !== null || true)')],
  ['finalDeLazos toma cualquier final por trato', 'T', (t) => t.replace("const cual = final === 'trato' || final === 'pelea' ? final : null;", "const cual = final === 'pelea' ? 'pelea' : 'trato';")],
  ['finalDeLazos sin final deja pasar las de `solo`', 'T', (t) => t.replace('(x.solo === undefined || x.solo === cual)', '(x.solo === undefined || cual === null || x.solo === cual)')],
  ['finalDeLazos con el final al revés', 'T', (t) => t.replace("const cual = final === 'trato' || final === 'pelea' ? final : null;", "const cual = final === 'trato' ? 'pelea' : final === 'pelea' ? 'trato' : null;")],
  ['finalDeLazos toma siempre la primera línea', 'T', (t) => t.replace('lista.find((x) => lazoCumple(x, f(quien)) && (x.solo === undefined || x.solo === cual))', 'lista[0]')],
  ['finalDeLazos toma la última línea', 'T', (t) => t.replace('lista.find((x) => lazoCumple(x, f(quien)) && (x.solo === undefined || x.solo === cual))', 'lista.findLast((x) => lazoCumple(x, f(quien)) && (x.solo === undefined || x.solo === cual))')],
  ['finalDeLazos en otro orden', 'T', (t) => t.replace('for (const quien of VECINOS_LAZO) {\n    const lista', 'for (const quien of [...VECINOS_LAZO].reverse()) {\n    const lista')],
  ['finalDeLazos con otra firma', 'T', (t) => t.replace('export function finalDeLazos(lazoDe, final)', 'export function finalDeLazos(final, lazoDe)')],
  ['finalDeLazos que no soporta basura', 'T', (t) => t.replace("const f = typeof lazoDe === 'function' ? lazoDe : () => 0;", 'const f = lazoDe;')],
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
    try { const m = await cargar(tmp); r = todo(m.ME, m.MT, m.textoE, m.textoT, O); } catch (err) { r = ['no carga: ' + err.message]; }
    if (r.length) atrapadasCodigo++; else console.log('NO ATRAPÓ la mutación de código: ' + nombre + ` (${i})`);
    ok(r.length > 0, `atrapa la mutación de código «${nombre}»`);
  }
  // control: la copia sin tocar, importada igual desde la carpeta temporal, pasa
  writeFileSync(join(tmp, 'historia-escenas-lazos.js'), real.textoE);
  writeFileSync(join(tmp, 'historia-texto-lazos.js'), real.textoT);
  const m = await cargar(tmp);
  const r = todo(m.ME, m.MT, m.textoE, m.textoT, O);
  ok(r.length === 0, 'la copia sin mutar, cargada desde la carpeta temporal, pasa: ' + r.slice(0, 5).join(' | '));
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
ok(atrapadas === MUT_DATOS.length && atrapadasCodigo === MUT_CODIGO.length, `atrapó ${atrapadas}/${MUT_DATOS.length} mutaciones de datos y ${atrapadasCodigo}/${MUT_CODIGO.length} de código`);

console.log(fallas ? `FALLARON ${fallas} de ${n}` : `verificar-4-19-0-b: ${n} comprobaciones OK (${MUT_DATOS.length} mutaciones de datos y ${MUT_CODIGO.length} de código atrapadas)`);
process.exit(fallas ? 1 : 0);
