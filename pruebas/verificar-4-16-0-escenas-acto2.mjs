// 4.16.0 (B): las escenas y los textos del ACTO II de la Historia (src/historia-escenas-acto2.js, -c5 … -c8, historia-texto-acto2.js). Sólo Node.
// Las escenas son datos: la prueba las valida con el director real (escenas.js), las corre de punta a punta por TODOS los caminos de elección
// (y por todas las combinaciones de decisiones y lazos que cada una mira) con un mundo de mentira, las salta, y revisa los textos (cabe en el
// cuadro, sin inglés, sin palabras religiosas ni explícitas, sin nombrar nada que no exista en el juego). Al final hay MUTACIONES de los datos
// (se rompe una garantía a propósito) y la prueba tiene que atraparlas todas.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { ESCENAS_ACTO2, IDS_ACTO2, EFECTOS_ACTO2, DISPARO_ACTO2, POR_DEFECTO_ACTO2 } from '../src/historia-escenas-acto2.js';
import { ESCENAS_ACTO1 } from '../src/historia-escenas-acto1.js';
import { TEXTO_ACTO2, entradaDe2, cierreDe2, premioDe2, paginaTratosDe2, charlaDe2 } from '../src/historia-texto-acto2.js';
import { parsearEfecto, efectosDe, condicionesDe, CONDICIONES_HISTORIA, POSE_DE } from '../src/historia-escenas-util.js';
import { PERSONAJES_ACTO2, pj } from '../src/historia-escenas-acto2-util.js';
import { crearDirector, validarEscena, PERSONAJES_BASE, POSES_ESCENA, MAX_OPCIONES } from '../src/escenas.js';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => readFileSync(join(raiz, f), 'utf8');
let n = 0, fallas = 0;
const ok = (c, t) => { n++; if (!c) { fallas++; console.log('FALLA ' + t); } };

const IDS_PEDIDOS = [
  'piedras-molino', 'zaino-ramon', 'tito-coihue', 'coihue-en-pie', 'coihue-talado', 'tobias-pirca', 'rueda-gira', 'trigo-abuelo', 'tablas-tito', 'truchas-nicanor',
  'luces-lago-nicanor', 'el-que-vuela', 'guardia-molino', 'huellas-escarcha', 'ramon-raiz', 'perdidas-devueltas', 'masa-crece', 'foto-sofia',
  'primera-molienda', 'molienda-fletes', 'molienda-fiado', 'molienda-partir', 'minga-aldea', 'fermin-mulas', 'galpon-ronda',
  'cuaderno-1', 'cuaderno-2', 'cuaderno-3', 'libreta-fiado', 'cuaderno-abuelo', 'los-del-cerro', 'secreto-ramon', 'fogon-leyenda', 'pluma-umbral', 'veta-vuelve', 'mulas-belisario', 'herminia-noventa',
];
// lo que el guion usa y todavía no existe en el juego (va como pedido para el agente A en CAMBIOS_4_16_0_B.md): se tolera, pero tiene que estar anotado
const CLAVES_PEDIDAS = ['graciela'];
// los nombres propios que el texto puede usar en medio de una frase: personas y lugares que existen (o que el guion trae a propósito)
const NOMBRES_OK = new Set(['Administración', 'Aires', 'Aldea', 'Arroyo', 'Aurelio', 'Belisario', 'Buenos', 'Don', 'Duendes', 'Elsa', 'Ercilia', 'Esquel', 'Estación', 'Eusebio', 'Fermín', 'Graciela', 'Herminia', 'Josefina', 'Nicanor', 'Nélida', 'Pugh', 'Ramal', 'Ramón', 'Refugio', 'Rosa', 'Trevelin', 'Valle', 'Bariloche', 'Gales', 'Ernesto',
  'Tito', 'Tobías', 'Sofía', 'Nahuel', 'Lucía', 'Aníbal', 'Salazar', 'Prieto', 'Diolch', 'Julia', 'Millán', 'Molino', 'Cuentas', 'Paso', 'Puesto', 'Alto', 'Llancafil', 'Fiesta', 'Cosecha']);
const PERSONAS_REALES = ['Aurelio', 'Belisario', 'Herminia', 'Rosa', 'Fermín', 'Nélida', 'Ernesto', 'Nicanor', 'Ramón', 'Josefina', 'Ercilia', 'Elsa', 'Tito', 'Tobías', 'Sofía', 'Nahuel', 'Lucía'];
const MAX_LINEA = 260;      // letras por línea de diálogo: cabe en cuatro renglones del cuadro (840 px, 21 px)
const MAX_OPCION = 96;      // una opción de elección (un botón)
const MAX_PREGUNTA = 72;
const MAX_PARRAFO = 420;    // un párrafo de tarjeta
const TIPOS_DUENDE = ['rastreador', 'volador', 'enjambre', 'excavador', 'jefe'];
const DECISIONES_ACTO2 = ['coihue', 'molienda', 'cuaderno'];

// palabras enteras con letras de verdad (el \b de JavaScript no sabe de acentos: «cruzó» no es «cruz»)
const pal = (lista) => new RegExp(String.raw`(?<![\p{L}\p{N}])(?:${lista})(?![\p{L}\p{N}])`, 'iu');
const INGLES = pal("the|and|you|your|with|this|that|have|from|they|will|would|there|here|what|when|where|which|are|was|were|not|but|for|into|our|his|her|she|him|its|okay|hello|sorry|please|thanks|yes|don't|can't|it's");
const SAGRADO = pal("dios|diablo|santo|santa|santos|virgen|ángel|ángeles|angeles|cruz|rez\\p{L}*|oración|infierno|demonio\\p{L}*|iglesia|capilla|misa|altar|bautiz\\p{L}*|cristo|jesús|plegaria|bendito|pachamama|gauchito|difunta correa|nguillatún|kalku|machi|bendec\\p{L}*|bendic\\p{L}*|sagrad\\p{L}*|ofrenda\\p{L}*|milagro\\p{L}*");
const EXPLICITO = pal("sexo|sexual\\p{L}*|desnud\\p{L}*|tetas?|pene|verga|coger|cogiendo|culo|orgasm\\p{L}*|erótic\\p{L}*|follar|concha|puta\\p{L}*|mierda|carajo|boludo\\p{L}*|pija");
// lo que nunca existió en el juego y el guion pudo nombrar por error
const INEXISTENTE = pal("hospedaje|hotel|posada|hostal|pensión|escuela de música|farmacia|banco de la aldea");

// ---------------------------------------------------------------- texto de lo que existe en el juego
const FUENTES = {
  gente: leer('src/gente.js'), aldea: leer('src/aldea.js'), campo: leer('src/gente-campo.js'), config: leer('src/config.js'),
  todo: '',
};
FUENTES.todo = ['src/estructuras.js', 'src/trochita.js', 'src/terreno.js'].map(leer).join('\n');
const clavesDelJuego = () => {
  const r = new Set();
  for (const m of FUENTES.gente.matchAll(/^  ([a-z]+): \{ nombre:/gm)) r.add(m[1]);
  for (const m of FUENTES.aldea.matchAll(/^  ([a-z]+): \{\s*$/gm)) r.add(m[1]);
  for (const m of FUENTES.campo.matchAll(/^  ([a-z]+): \{\s*$/gm)) r.add(m[1]);
  return r;
};
const lugaresDelJuego = () => {
  const r = new Set();
  for (const m of FUENTES.config.matchAll(/^  ([a-z]+): \{ x:/gm)) r.add(m[1]);
  for (const m of FUENTES.todo.matchAll(/lugares\.([a-z]+) *=/g)) r.add(m[1]);
  return r;
};
const CLAVES = clavesDelJuego(), LUGARES = lugaresDelJuego();

// ---------------------------------------------------------------- recorrer los textos de las escenas
function textosDe(e) {
  const t = [];
  const lin = (l) => { if (typeof l === 'string') t.push(l); else if (l && typeof l.texto === 'string') t.push(l.texto); };
  for (const p of e.pasos || []) {
    if (p.tipo === 'dialogo') { (Array.isArray(p.lineas) ? p.lineas : [p.texto]).forEach(lin); }
    if (p.tipo === 'eleccion') { t.push(p.pregunta || ''); for (const o of p.opciones || []) t.push(o.texto); }
  }
  if (typeof e.titulo === 'string') t.push(e.titulo);
  if (typeof e.resumen === 'string') t.push(e.resumen);
  return t;
}
function lineasDeDialogo(e) {
  const r = [];
  for (const p of e.pasos || []) if (p.tipo === 'dialogo') for (const l of (Array.isArray(p.lineas) ? p.lineas : [p.texto])) r.push(typeof l === 'string' ? l : l.texto);
  return r;
}
function textosPlanos(obj, acc = []) {
  if (typeof obj === 'string') acc.push(obj);
  else if (Array.isArray(obj)) obj.forEach((x) => textosPlanos(x, acc));
  else if (obj && typeof obj === 'object') for (const [k, v] of Object.entries(obj)) { if (['id', 'tecla', 'd', 'es', 'decision', 'optativa', 'escena', 'estacion', 'desbloqueo', 'donde'].includes(k) && typeof v === 'string') continue; textosPlanos(v, acc); }
  return acc;
}
function lugaresUsados(e) {
  const r = new Set();
  const rec = (v) => {
    if (Array.isArray(v)) v.forEach(rec);
    else if (v && typeof v === 'object') { if (typeof v.lugar === 'string') r.add(v.lugar); for (const x of Object.values(v)) rec(x); }
  };
  rec(e.pasos);
  return r;
}
function hablantesUsados(e) {
  const r = new Set();
  const paso = (p) => {
    if (p.tipo === 'dialogo') { r.add(p.quien); for (const l of Array.isArray(p.lineas) ? p.lineas : []) if (l && l.quien) r.add(l.quien); }
    if (p.tipo === 'gesto') r.add(p.quien);
    if (p.tipo === 'fundido') for (const q of p.alMedio || []) paso(q);
  };
  for (const p of e.pasos || []) paso(p);
  return r;
}
// las decisiones y los lazos que una escena mira (para correrla con todas las combinaciones)
function condicionesMiradas(e) {
  const decs = new Set(), lazos = new Set();
  const rec = (v) => {
    if (Array.isArray(v)) v.forEach(rec);
    else if (v && typeof v === 'object') {
      if (v.cond === 'decision' && v.args) decs.add(v.args.d);
      if (v.cond === 'lazo' && v.args) lazos.add(v.args.quien);
      for (const x of Object.values(v)) rec(x);
    }
  };
  rec(e.pasos);
  return { decs: [...decs], lazos: [...lazos] };
}
const variantesDe = (e) => {
  const { decs, lazos } = condicionesMiradas(e);
  let r = [{ decisiones: {}, lazos: {} }];
  for (const d of decs) r = r.flatMap((v) => ['a', 'b', 'c'].map((x) => ({ ...v, decisiones: { ...v.decisiones, [d]: x } })));
  for (const q of lazos) r = r.flatMap((v) => [2, -2].map((x) => ({ ...v, lazos: { ...v.lazos, [q]: x } })));
  return r;
};

// ---------------------------------------------------------------- un mundo de mentira
function mundoFalso() {
  const claves = ['guarda', 'ramon', 'ema', 'ercilia', 'nicanor', 'nelida', 'jefe', 'abuela', 'panadera', 'fermin', 'graciela', 'carpintero', 'tobias', 'belisario', 'nene', 'nena', 'fotografa'];
  const actores = {};
  claves.forEach((k, i) => { actores[k] = { x: 30 + i * 3, y: 0, z: -20 - i * 2, meta: null, vel: 1.4, capt: false, visible: true }; });
  const lugares = { refugio: { x: -120, z: 232 }, estacion: { x: 300, z: 90 }, almacen: { x: 60, z: 40 }, galpon: { x: 228, z: -110 }, mirador: { x: -292, z: 36 }, molino: { x: -80, z: 120 }, faro: { x: -200, z: 300 }, muelle: { x: -150, z: 260 }, mallin: { x: 100, z: -200 } };
  const w = {
    actores, hv: 18, sonidos: [], posadas: [], tele: [], libres: [], empezo: 0, termino: 0, horas: [],
    puedeEmpezar: () => true,
    posicion(ref) {
      if (ref === 'jugador') return { x: 0, y: 0, z: 0 };
      if (typeof ref === 'string') { const a = Object.hasOwn(actores, ref) ? actores[ref] : null; return a ? { x: a.x, y: a.y, z: a.z } : null; }
      if (ref && typeof ref.lugar === 'string') { const l = Object.hasOwn(lugares, ref.lugar) ? lugares[ref.lugar] : null; return l ? { x: l.x + (ref.dx || 0), z: l.z + (ref.dz || 0) } : null; }
      if (ref && ref.frente === 'jugador') return { x: ref.lado || 0, z: -(ref.dist ?? 3) };
      if (ref && typeof ref.frente === 'string' && Object.hasOwn(actores, ref.frente)) { const a = actores[ref.frente]; return { x: a.x + (ref.lado || 0), z: a.z - (ref.dist ?? 3) }; }
      return null;
    },
    suelo: () => 0,
    camaraJugador: () => ({ x: 0, y: 1.6, z: 0, yaw: 0.3, pitch: -0.1, fov: 70 }),
    horaActual: () => w.hv,
    hora(h) { w.hv = h; w.horas.push(h); },
    clima() {},
    sonido(id) { w.sonidos.push(id); },
    capturar(k) { if (actores[k]) actores[k].capt = true; },
    soltar(k) { if (actores[k]) { actores[k].capt = false; w.libres.push(k); } },
    caminar(k, d, o) { if (actores[k]) { actores[k].meta = d; actores[k].vel = o?.vel || 1.4; } },
    ocupado: (k) => !!actores[k]?.meta,
    mirar() {},
    posar(k, pose) { w.posadas.push([k, pose]); },
    aparecer(k, p) { if (actores[k]) Object.assign(actores[k], { x: p.x, y: p.y ?? 0, z: p.z, visible: true, meta: null }); },
    desaparecer(k) { if (actores[k]) actores[k].visible = false; },
    teletransportar(k, p) { if (actores[k]) Object.assign(actores[k], { x: p.x, z: p.z, meta: null }); w.tele.push(k); },
    alEmpezar() { w.empezo++; },
    alTerminar() { w.termino++; },
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

// Arma un director con los efectos y las condiciones de la convención (recordando qué corrió) y corre una escena con un guion de elecciones.
// `decisiones`: la historia (D1…D4). `lazos`: { quien: n } para la condición de lazo (min/max). Devuelve { lineas, corridos, errores… }
function correrEscena(escena, { script = [], decisiones = {}, lazos = {}, eventos = [], saltarAl = -1, efectosExtra = [] } = {}) {
  const mundo = mundoFalso();
  const est = { vistas: {}, elecciones: {} };
  const corridos = [];
  const dec = { ...decisiones };
  const resultados = [];
  const efectos = {};
  for (const nombre of [...EFECTOS_ACTO2, ...efectosExtra]) {
    efectos[nombre] = (args, ctx) => {
      corridos.push({ nombre, args, saltando: ctx.saltando });
      const p = parsearEfecto(nombre);
      if (p && p.tipo === 'decision') dec[p.d] = p.v;
    };
  }
  const condiciones = {
    decision: (c) => (dec[c.args.d] ?? 'ninguna') === c.args.es,
    lazo: (c) => { const v = lazos[c.args.quien] ?? 0; return (c.args.min === undefined || v >= c.args.min) && (c.args.max === undefined || v <= c.args.max); },
    evento: (c) => eventos.includes(c.args.id),
  };
  const dir = crearDirector({ mundo, estado: () => est, dia: () => 5, efectos, condiciones, alTerminar: (r) => resultados.push(r) });
  const reg = dir.registrar(escena);
  const log = { reg, lineas: [], hablantes: [], elecciones: [], pasos: 0, activa: false, camaras: 0 };
  if (!reg.ok) return { ...log, mundo, corridos, resultados, dir, est, dec, falloRegistro: true };
  log.faltan = dir.efectosFaltantes(escena.id);
  if (!dir.disparar(escena.id)) { log.noDisparo = true; return { ...log, mundo, corridos, resultados, dir, est, dec }; }
  let ultima = '', i = 0, k = 0;
  while (dir.activa() && i++ < 60000) {
    mundo.simular(0.05);
    dir.actualizar(0.05);
    if (saltarAl >= 0 && i === saltarAl) { dir.saltar(); continue; }
    const d = dir.datos(), cam = dir.camara();
    if (cam) log.camaras++;
    if (d?.eleccion) {
      const idx = k < script.length ? script[k] : 0;
      log.elecciones.push({ id: d.eleccion.id, n: d.eleccion.opciones.length, tomada: idx, texto: d.eleccion.opciones[idx]?.texto });
      k++;
      dir.elegir(idx);
    } else if (d?.dialogo && d.fase === 'corriendo') {
      if (d.dialogo.completo) {
        const clave = `${d.dialogo.nombre}|${d.dialogo.texto}`;
        if (clave !== ultima) { log.lineas.push(d.dialogo.texto); log.hablantes.push(d.dialogo.quien); ultima = clave; }
        dir.avanzar();
      }
    }
  }
  log.pasos = i;
  log.activa = dir.activa();
  return { ...log, mundo, corridos, resultados, dir, est, dec };
}
// todos los caminos de elección de una escena (cada combinación de opciones)
function caminos(escena, base = {}) {
  const hechos = [];
  const explorar = (script) => {
    const r = correrEscena(escena, { ...base, script });
    hechos.push({ script, r });
    if (r.elecciones.length > script.length) {
      const e = r.elecciones[script.length];
      for (let i = 0; i < e.n; i++) explorar([...script, i]);
    }
  };
  explorar([]);
  const vistos = new Set();
  return hechos.filter(({ r }) => { const c = r.elecciones.map((e) => e.tomada).join(','); if (vistos.has(c)) return false; vistos.add(c); return true; });
}

// ---------------------------------------------------------------- la suite sobre los datos (los reales o uno mutado)
// Devuelve la lista de lo que falló (vacía si todo está bien). Se usa igual para los datos reales y para cada mutante.
function suite(ESC, TEX, fuentes) {
  const f = [];
  const c = (cond, t) => { if (!cond) f.push(t); };
  const ids = Object.keys(ESC);
  const escenas = Object.values(ESC);

  // 1) los ids exactos
  c(IDS_PEDIDOS.every((id) => ids.includes(id)), 'faltan escenas: ' + IDS_PEDIDOS.filter((id) => !ids.includes(id)).join(', '));
  c(ids.length === IDS_PEDIDOS.length, 'hay escenas de más o de menos (' + ids.length + ')');
  c(Object.entries(ESC).every(([k, e]) => e && e.id === k), 'el id de cada escena coincide con su clave');
  c(ids.every((id) => !Object.hasOwn(ESCENAS_ACTO1, id)), 'un id de escena choca con el acto I');

  // 2) válidas con el validador del motor
  for (const e of escenas) {
    const v = validarEscena(e);
    c(v.ok, `${e?.id}: no valida (${(v.errores || []).join('; ')})`);
    c(typeof e.resumen === 'string' && e.resumen.length > 20, `${e?.id}: sin resumen para cuando se salta`);
    c(typeof e.titulo === 'string' && e.titulo.length > 2, `${e?.id}: sin título`);
    c(e.acto === 2 && e.capitulo >= 5 && e.capitulo <= 8, `${e?.id}: acto o capítulo fuera del acto II`);
    c(!e.efimera, `${e?.id}: no puede ser efímera (tiene que quedar vista)`);
  }

  // 3) la cámara y el diálogo
  for (const e of escenas) {
    const planos = e.pasos.filter((p) => p.tipo === 'plano').length + e.pasos.filter((p) => p.tipo === 'dialogo').reduce((s, p) => s + (Array.isArray(p.lineas) ? p.lineas.filter((l) => l && l.plano).length : 0), 0);
    c(planos >= 2, `${e.id}: menos de dos planos de cámara`);
    c(e.pasos.some((p) => p.tipo === 'dialogo'), `${e.id}: sin diálogo`);
  }

  // 4) efectos y condiciones: la convención de nombres
  for (const e of escenas) {
    for (const nombre of efectosDe(e)) c(parsearEfecto(nombre), `${e.id}: el efecto «${nombre}» no sigue la convención`);
    for (const cond of condicionesDe(e)) c(CONDICIONES_HISTORIA.includes(cond), `${e.id}: la condición «${cond}» no está en la convención`);
    // los efectos con args de duende llevan un tipo de duende que existe
    const rec = (p) => {
      if (p.tipo === 'efecto' && typeof p.nombre === 'string' && p.nombre.startsWith('duende:') && p.args && p.args.tipo !== undefined) c(TIPOS_DUENDE.includes(p.args.tipo), `${e.id}: el duende «${p.nombre}» lleva un tipo desconocido «${p.args.tipo}»`);
      if (p.tipo === 'fundido') for (const q of p.alMedio || []) rec(q);
    };
    e.pasos.forEach(rec);
    // las condiciones por elección apuntan a una elección de la misma escena
    const elecs = new Set(e.pasos.filter((p) => p.tipo === 'eleccion').map((p) => p.id));
    for (const p of e.pasos) if (p.si && typeof p.si.eleccion === 'string') c(elecs.has(p.si.eleccion), `${e.id}: un paso mira la elección «${p.si.eleccion}», que no existe en la escena`);
  }
  const usados = new Set(escenas.flatMap((e) => efectosDe(e)));
  c([...usados].every((x) => EFECTOS_ACTO2.includes(x)), 'EFECTOS_ACTO2 no cubre los efectos usados');

  // 5) las elecciones: cada opción tiene efecto, o es de sabor declarado; ids únicos entre todas las escenas
  let totalElecciones = 0, conEfecto = 0;
  const idsEleccion = new Set([...Object.values(ESCENAS_ACTO1).flatMap((e) => e.pasos.filter((p) => p.tipo === 'eleccion').map((p) => p.id))]);
  for (const e of escenas) {
    for (const p of e.pasos.filter((q) => q.tipo === 'eleccion')) {
      totalElecciones++;
      c(!idsEleccion.has(p.id), `${e.id}/${p.id}: id de elección repetido (las elecciones guardadas son planas por id)`);
      idsEleccion.add(p.id);
      c(p.opciones.length >= 2 && p.opciones.length <= MAX_OPCIONES, `${e.id}/${p.id}: de 2 a ${MAX_OPCIONES} opciones`);
      c(p.opciones.length <= 3, `${e.id}/${p.id}: más de 3 opciones (el guion pide 2 o 3)`);
      c(Number.isInteger(p.porDefecto) && p.porDefecto >= 0 && p.porDefecto < p.opciones.length, `${e.id}/${p.id}: porDefecto inválido`);
      for (const o of p.opciones) {
        const declarada = !!o.efecto || o.sabor === true;
        c(declarada, `${e.id}/${p.id}/${o.id}: la opción no tiene efecto y no es de sabor declarado`);
        c(!(o.efecto && o.sabor === true), `${e.id}/${p.id}/${o.id}: efecto y sabor a la vez`);
        if (o.efecto) conEfecto++;
        c(o.texto.length <= MAX_OPCION, `${e.id}/${p.id}/${o.id}: opción demasiado larga (${o.texto.length})`);
      }
      c((p.pregunta || '').length > 3 && p.pregunta.length <= MAX_PREGUNTA, `${e.id}/${p.id}: pregunta ausente o larga`);
    }
  }
  c(totalElecciones >= 35, 'pocas elecciones en todo el acto (' + totalElecciones + ')');
  c(conEfecto >= 20, 'pocas elecciones con efecto (' + conEfecto + ')');

  // 6) los hablantes están declarados y existen en el juego
  for (const e of escenas) {
    const decl = { ...PERSONAJES_BASE, ...(e.personajes || {}) };
    for (const q of hablantesUsados(e)) c(q && Object.hasOwn(decl, q), `${e.id}: hablante o actor sin declarar «${q}»`);
    for (const [k, pjx] of Object.entries(e.personajes || {})) {
      if (pjx.clave) c(fuentes.claves.has(pjx.clave) || CLAVES_PEDIDAS.includes(pjx.clave), `${e.id}: «${k}» usa la clave «${pjx.clave}» que no existe en el juego`);
      c(typeof pjx.nombre === 'string' && /^#[0-9a-f]{6}$/i.test(pjx.color || ''), `${e.id}: personaje «${k}» sin nombre o color`);
    }
    const posar = (p) => { if (p.tipo === 'gesto' && p.accion === 'posar') c(POSES_ESCENA.includes(p.pose), `${e.id}: pose «${p.pose}» que el motor no sabe`); if (p.tipo === 'fundido') (p.alMedio || []).forEach(posar); };
    e.pasos.forEach(posar);
    for (const l of e.pasos.filter((p) => p.tipo === 'dialogo').flatMap((p) => p.lineas)) if (l && l.gesto) c(POSES_ESCENA.includes(l.gesto.pose), `${e.id}: pose de línea «${l.gesto.pose}» que el motor no sabe`);
    // lugares con nombre: tienen que existir en T.lugares
    for (const l of lugaresUsados(e)) c(fuentes.lugares.has(l), `${e.id}: el lugar «${l}» no existe en T.lugares`);
  }

  // 7) los textos: largos, idioma, religión, explícitos, cosas inexistentes
  for (const e of escenas) {
    for (const l of lineasDeDialogo(e)) {
      c(typeof l === 'string' && l.trim().length > 0, `${e.id}: línea vacía`);
      c(l.length <= MAX_LINEA, `${e.id}: línea demasiado larga (${l.length}): «${l.slice(0, 40)}…»`);
    }
    for (const t of textosDe(e)) {
      c(!INGLES.test(t), `${e.id}: inglés en «${t.slice(0, 50)}»`);
      c(!SAGRADO.test(t), `${e.id}: palabra religiosa en «${t.slice(0, 50)}»`);
      c(!EXPLICITO.test(t), `${e.id}: palabra explícita en «${t.slice(0, 50)}»`);
      c(!INEXISTENTE.test(t), `${e.id}: nombra algo que no existe en el juego en «${t.slice(0, 50)}»`);
      c(!/\bscratch\b/i.test(t), `${e.id}: menciona lo que no se menciona`);
    }
  }
  const textoTarjetas = textosPlanos(TEX);
  for (const t of textoTarjetas) {
    c(!INGLES.test(t), `texto: inglés en «${t.slice(0, 50)}»`);
    c(!SAGRADO.test(t), `texto: palabra religiosa en «${t.slice(0, 50)}»`);
    c(!EXPLICITO.test(t), `texto: palabra explícita en «${t.slice(0, 50)}»`);
    c(!INEXISTENTE.test(t), `texto: nombra algo que no existe en «${t.slice(0, 50)}»`);
    c(t.length <= MAX_PARRAFO, `texto: párrafo demasiado largo (${t.length}): «${t.slice(0, 40)}…»`);
  }

  // 7b) los nombres propios: sólo personas que existen en el juego (o el guion trae a propósito) y lugares reales
  for (const tx of [...escenas.flatMap((e) => textosDe(e)), ...textoTarjetas]) {
    for (const m of tx.matchAll(/(?<=[a-záéíóúñ,;:] )([A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,})/g)) c(NOMBRES_OK.has(m[1]), `nombre propio que no existe en el juego: «${m[1]}» en «${tx.slice(0, 40)}»`);
  }
  for (const p of PERSONAS_REALES) c(fuentes.textoJuego.includes(p), `la persona «${p}» no está en el código del juego`);

  // 8) las tarjetas del acto II
  for (const num of [5, 6, 7, 8]) {
    const cap = TEX.capitulos?.[num];
    c(!!cap, `falta el capítulo ${num}`);
    if (!cap) continue;
    c(cap.entrada?.length >= 2 && cap.entrada.every((p) => p.length > 30), `capítulo ${num}: entrada incompleta`);
    c(cap.cierre?.base?.length >= 1, `capítulo ${num}: sin cierre`);
    c(cap.objetivos?.length >= 5 && cap.objetivos.every((o) => o.id && o.texto && o.tecla), `capítulo ${num}: objetivos incompletos`);
    c(cap.optativas?.length >= 2 && cap.optativas.every((o) => o.id && o.texto), `capítulo ${num}: optativas incompletas`);
    c(cap.premio?.texto && cap.premio.texto.length > 10, `capítulo ${num}: sin premio en texto`);
    c(cap.acto === 2 && cap.dia === num, `capítulo ${num}: acto o día mal`);
    // el cierre y la entrada con variantes por decisión (a, b y c)
    const seg = cap.cierre?.segun;
    c(!!seg && typeof seg.d === 'string' && ['a', 'b', 'c'].every((v) => typeof seg[v] === 'string' && seg[v].length > 20), `capítulo ${num}: el cierre no tiene las tres variantes por decisión`);
  }
  const pk = TEX.capitulos?.[5];
  c(pk?.puerta && pk.puerta.temprano?.length >= 1 && pk.puerta.tarde?.length >= 1, 'capítulo 5: falta la puerta de estación (temprano / tarde)');
  c(TEX.capitulos?.[5]?.cierre?.segun?.d === 'coihue' && TEX.capitulos?.[7]?.cierre?.segun?.d === 'molienda' && TEX.capitulos?.[8]?.cierre?.segun?.d === 'cuaderno', 'los cierres varían por coihue (5), molienda (7) y cuaderno (8)');
  c(TEX.capitulos?.[8]?.premio?.segun?.d === 'cuaderno' && ['a', 'b', 'c'].every((v) => typeof TEX.capitulos[8].premio.segun[v] === 'string'), 'el premio del capítulo 8 varía según el cuaderno (leña, poncho, flete)');
  const raros = TEX.raro || {};
  for (const [id, r] of Object.entries(raros)) {
    c(parsearEfecto(`raro:${id}`), `raro «${id}»: id fuera de la convención`);
    c(typeof r.texto === 'string' && r.texto.length > 15 && typeof r.titulo === 'string' && r.cap >= 5 && r.cap <= 8 && typeof r.donde === 'string', `raro «${id}»: entrada incompleta`);
  }
  // cada raro / objeto que una escena anota existe en los textos
  for (const nombre of usados) {
    const p = parsearEfecto(nombre);
    if (!p) continue;
    if (p.tipo === 'raro') c(Object.hasOwn(raros, p.id), `raro «${p.id}» usado por una escena y sin texto`);
    if (p.tipo === 'objeto' || p.tipo === 'entrega') c(Object.hasOwn(TEX.objetos || {}, p.id), `objeto «${p.id}» usado por una escena y sin texto`);
  }
  // cada entrada del cuaderno de lo raro la anota alguna escena (nada huérfano)
  for (const id of Object.keys(raros)) c(usados.has(`raro:${id}`), `raro «${id}»: ninguna escena lo anota`);
  // las notas de las tres páginas del cuaderno
  for (const id of ['cuaderno-0', 'cuaderno-1', 'cuaderno-2', 'cuaderno-3', 'libreta-raiz', 'cuaderno-abuelo', 'pagina-tratos']) c(Array.isArray(TEX.notas?.[id]?.texto) && TEX.notas[id].texto.length >= 1, `falta la nota «${id}»`);

  // las decisiones del acto II: cada una con sus tres opciones, en la escena que corresponde
  for (const [d, esc, el] of [['coihue', 'tito-coihue', 'coihue'], ['molienda', 'primera-molienda', 'molienda'], ['cuaderno', 'fogon-leyenda', 'cuaderno']]) {
    const p = ESC[esc]?.pasos.find((q) => q.tipo === 'eleccion' && q.id === el);
    c(!!p && p.opciones.length === 3 && p.opciones.every((o) => o.efecto === `decision:${d}:${o.id}`), `${esc}: cada opción de la decisión «${d}» guarda su propia decisión`);
    c(['a', 'b', 'c'].every((v) => usados.has(`decision:${d}:${v}`)), `la decisión «${d}» no tiene las tres opciones`);
    c(!!p && p.opciones[p.porDefecto]?.id === POR_DEFECTO_ACTO2[d], `${esc}: la opción por defecto no coincide con POR_DEFECTO_ACTO2`);
  }
  // la charla de los vecinos
  const vecinos = ['ramon', 'nicanor', 'josefina', 'ercilia', 'fermin', 'herminia', 'rosa', 'elsa', 'graciela', 'tito', 'tobias', 'belisario'];
  for (const v of vecinos) {
    const l = TEX.charla?.[v];
    c(Array.isArray(l) && l.length >= 2, `charla: ${v} tiene menos de dos líneas`);
    for (const x of l || []) c(x.id && x.cap >= 5 && x.cap <= 8 && typeof x.texto === 'string' && x.texto.length > 20 && x.texto.length <= MAX_LINEA, `charla ${v}/${x.id}: línea inválida`);
  }
  const idsCharla = vecinos.flatMap((v) => (TEX.charla?.[v] || []).map((x) => x.id));
  c(new Set(idsCharla).size === idsCharla.length, 'charla: ids repetidos');
  c(idsCharla.length >= 40, 'charla: pocas líneas en total (' + idsCharla.length + ')');

  // 9) la tabla de disparo cubre todas las escenas, y su objetivo existe en el capítulo
  for (const id of ids) {
    const d = fuentes.disparo?.[id];
    c(!!d && d.cap >= 5 && d.cap <= 8 && typeof d.jugadorEn === 'string' && typeof d.cuando === 'string', `${id}: sin datos de disparo`);
    if (d && d.objetivo !== null && d.objetivo !== undefined) {
      const capTx = TEX.capitulos?.[d.cap];
      const oks = [...(capTx?.objetivos || []), ...(capTx?.optativas || [])].map((o) => o.id);
      c(oks.includes(d.objetivo), `${id}: el objetivo «${d.objetivo}» no existe en el capítulo ${d.cap}`);
    }
    if (d && ESC[id]) c(ESC[id].capitulo === d.cap, `${id}: el capítulo de la escena y el de la tabla de disparo no coinciden`);
  }
  return f;
}

const fuentes = { claves: CLAVES, lugares: LUGARES, disparo: DISPARO_ACTO2, textoJuego: FUENTES.aldea + FUENTES.gente + FUENTES.campo };
const reales = suite(ESCENAS_ACTO2, TEXTO_ACTO2, fuentes);
ok(reales.length === 0, 'la suite de datos pasa: ' + reales.slice(0, 12).join(' | ') + (reales.length > 12 ? ` (+${reales.length - 12})` : ''));
ok(IDS_ACTO2.length === 37, '37 escenas');
ok(Object.keys(PERSONAJES_ACTO2).every((k) => Object.hasOwn(pj(k), k)), 'los personajes del acto II se arman con pj()');

// ---------------------------------------------------------------- las escenas corren (todos los caminos, todas las variantes) y se saltan
let totalCaminos = 0, totalLineas = 0, totalCorridas = 0;
for (const [id, e] of Object.entries(ESCENAS_ACTO2)) {
  const variantes = variantesDe(e);
  ok(variantes.length >= 1, `${id}: tiene variantes para correr`);
  for (const v of variantes) {
    const camsRaiz = caminos(e, v);
    totalCaminos += camsRaiz.length;
    ok(camsRaiz.length >= 1, `${id}: se corre`);
    for (const { script, r } of camsRaiz) {
      totalCorridas++;
      const rot = `${id} [${script.join(',')}] ${JSON.stringify(v.decisiones)}${Object.keys(v.lazos).length ? JSON.stringify(v.lazos) : ''}`;
      ok(!r.falloRegistro && !r.noDisparo, `${rot}: registra y dispara`);
      ok(r.faltan?.length === 0, `${rot}: efectos sin registrar (${r.faltan})`);
      ok(!r.activa, `${rot}: termina`);
      ok(r.resultados.length === 1 && r.resultados[0].errores.length === 0, `${rot}: sin errores del director (${r.resultados[0]?.errores?.join('; ')})`);
      ok(r.dir.vista(id), `${rot}: queda vista`);
      ok(r.mundo.empezo === 1 && r.mundo.termino === 1, `${rot}: empieza y termina una vez`);
      ok(r.mundo.actores && Object.values(r.mundo.actores).every((a) => !a.capt), `${rot}: suelta a todos los personajes`);
      ok(r.camaras > 5, `${rot}: la cámara se movió`);
      ok(r.lineas.length >= 1, `${rot}: dijo alguna línea`);
      totalLineas += r.lineas.length;
      // cada efecto de opción elegida corrió
      for (const el of r.elecciones) {
        const paso = e.pasos.find((p) => p.tipo === 'eleccion' && p.id === el.id);
        paso.opciones.forEach((o, i) => {
          if (!o.efecto) return;
          const corrio = r.corridos.some((x) => x.nombre === o.efecto);
          if (i === el.tomada) ok(corrio, `${rot}: la opción ${o.id} no corrió su efecto ${o.efecto}`);
        });
      }
    }
  }
  // saltar apenas empieza, a la mitad y tarde: termina, queda vista, las elecciones usan el defecto y los efectos del camino corren
  for (const cuando of [2, 40, 300, 1500]) {
    const r = correrEscena(e, { saltarAl: cuando });
    ok(!r.activa && r.dir.vista(id) && r.resultados.length === 1 && r.resultados[0].errores.length === 0, `${id}: se puede saltar a los ${cuando} cuadros`);
  }
}
ok(totalCaminos >= 100, 'se corrieron muchos caminos (' + totalCaminos + ')');
ok(totalLineas >= 600, 'se dijeron muchas líneas en total (' + totalLineas + ')');

const quienes = (r) => r.corridos.map((x) => x.nombre);
const corrio = (id, o, ...nombres) => { const q = quienes(correrEscena(ESCENAS_ACTO2[id], o)); return nombres.every((x) => q.includes(x)); };
const noCorrio = (id, o, ...nombres) => { const q = quienes(correrEscena(ESCENAS_ACTO2[id], o)); return nombres.every((x) => !q.includes(x)); };

// saltar las escenas de decisión: la opción por defecto se toma, y lo que tiene que valer aunque se salte vale
{
  const r1 = correrEscena(ESCENAS_ACTO2['tito-coihue'], { saltarAl: 3 });
  ok(r1.corridos.some((x) => x.nombre === 'decision:coihue:a' && x.saltando === true), 'saltar tito-coihue deja el coihue en pie');
  const r2 = correrEscena(ESCENAS_ACTO2['primera-molienda'], { saltarAl: 3 });
  ok(r2.corridos.some((x) => x.nombre === 'decision:molienda:b' && x.saltando === true) && r2.corridos.some((x) => x.nombre === 'mundo:diez-bolsas'), 'saltar primera-molienda toma el fiado de invierno y deja las diez bolsas');
  const r3 = correrEscena(ESCENAS_ACTO2['fogon-leyenda'], { saltarAl: 3 });
  ok(['decision:cuaderno:b', 'lazo:ema:2', 'lazo:ramon:1', 'raro:fogon-leyenda'].every((x) => quienes(r3).includes(x)) && !quienes(r3).includes('lazo:ema:-1'), 'saltar el fogón toma «callar»: Josefina +2 y Ramón +1');
  const r4 = correrEscena(ESCENAS_ACTO2['galpon-ronda'], { saltarAl: 3 });
  ok(['objeto:cuaderno-eusebio', 'mundo:galpon-ronda', 'mundo:pozo-cuaderno', 'raro:cuaderno-hallado'].every((x) => quienes(r4).includes(x)), 'saltar galpon-ronda deja el cuaderno en la mochila y la ronda en el piso');
  const r5 = correrEscena(ESCENAS_ACTO2['pluma-umbral'], { saltarAl: 3 });
  ok(['objeto:pluma-condor', 'mundo:pluma-en-umbral', 'mundo:nieve-alta'].every((x) => quienes(r5).includes(x)), 'saltar pluma-umbral deja la pluma y la nieve');
  ok(corrio('perdidas-devueltas', { saltarAl: 3 }, 'entrega:dedal-ercilia', 'entrega:pipa-belisario', 'entrega:cuchara-rosa'), 'saltar las cosas perdidas igual las entrega');
  ok(corrio('huellas-escarcha', { saltarAl: 3 }, 'mundo:huellas-escarcha', 'mundo:yerba-en-raiz', 'raro:yerba-en-raiz'), 'saltar las huellas deja el rastro y la yerba');
  ok(corrio('rueda-gira', { saltarAl: 3 }, 'mundo:rueda-gira', 'raro:rueda-primera-vuelta'), 'saltar la rueda la deja girando');
}

// ---------------------------------------------------------------- las variantes según decisión, lazo y elección
{
  // D2: elegir guarda la decisión; las tres escenas de cumplimiento la reafirman y suman lo del guion
  for (const [i, v] of [[0, 'a'], [1, 'b'], [2, 'c']]) {
    const r = correrEscena(ESCENAS_ACTO2['tito-coihue'], { script: [i] });
    ok(r.corridos.filter((x) => x.nombre.startsWith('decision:')).map((x) => x.nombre).join() === `decision:coihue:${v}`, `tito-coihue opción ${i} guarda decision:coihue:${v}`);
  }
  ok(corrio('coihue-en-pie', {}, 'decision:coihue:a', 'lazo:ema:1', 'lazo:tito:-1') && noCorrio('coihue-en-pie', {}, 'lazo:ema:-2'), 'coihue-en-pie: decisión A, Josefina +1 y Tito −1');
  ok(corrio('coihue-talado', {}, 'decision:coihue:b', 'lazo:ema:-2', 'lazo:tito:2', 'dar:tabla-coihue:12', 'mundo:tocon-coihue', 'mundo:pago-tito') && noCorrio('coihue-talado', {}, 'lazo:ema:1'), 'coihue-talado: decisión B, Josefina −2, Tito +2, las doce tablas y el tocón');
  ok(corrio('tobias-pirca', {}, 'decision:coihue:c', 'lazo:ema:1', 'lazo:tobias:2', 'mundo:pirca-coihue', 'optativa:veta-vuelve'), 'tobias-pirca: decisión C, Josefina +1, Tobías +2, la pirca y la optativa de la veta');
  // la rueda: los puntitos verdes sólo si el coihue sigue en pie
  for (const [dec, verdes] of [['a', true], ['b', false], ['c', true]]) {
    const r = correrEscena(ESCENAS_ACTO2['rueda-gira'], { decisiones: { coihue: dec } });
    const q = quienes(r);
    ok(q.includes('mundo:puntitos-verdes') === verdes && q.includes('raro:puntos-verdes') === verdes, `rueda-gira con coihue ${dec}: puntitos verdes ${verdes}`);
    ok(r.lineas.some((l) => /puntitos verdes/.test(l)) === verdes && r.lineas.some((l) => /tocón/.test(l)) === !verdes, `rueda-gira con coihue ${dec}: el texto acompaña`);
  }
  // el zaíno y la piedra
  ok(corrio('zaino-ramon', { script: [2] }, 'lazo:ramon:1', 'mundo:zaino-prestado') && noCorrio('zaino-ramon', { script: [0] }, 'lazo:ramon:1') && corrio('zaino-ramon', { script: [0] }, 'mundo:zaino-prestado'), 'zaino-ramon: cuidarlo sube a Ramón; el zaino queda prestado igual');
  ok(corrio('piedras-molino', { script: [1] }, 'lazo:ema:1', 'raro:muelas-molino-viejo') && noCorrio('piedras-molino', { script: [0] }, 'lazo:ema:1'), 'piedras-molino: «no pensaba tocarlo» sube a Josefina');
  const pc = correrEscena(ESCENAS_ACTO2['piedras-molino'], { decisiones: { bolsa: 'c' } });
  const pn = correrEscena(ESCENAS_ACTO2['piedras-molino'], { decisiones: { bolsa: 'a' } });
  ok(pc.lineas.some((l) => /nota de Eusebio/.test(l)) && !pn.lineas.some((l) => /nota de Eusebio/.test(l)), 'piedras-molino: con la bolsa C Josefina saca la nota');
  // la guardia: saludan (A, C) o tiran bellotas (B)
  for (const dec of ['a', 'c']) {
    const r = correrEscena(ESCENAS_ACTO2['guardia-molino'], { decisiones: { coihue: dec } });
    ok(quienes(r).includes('duende:siluetas-raiz') && quienes(r).includes('duende:siluetas-saludan') && quienes(r).includes('raro:guardia-saludo') && !quienes(r).includes('duende:pillos-bellotas') && !quienes(r).includes('raro:noche-piedritas'), `guardia-molino con coihue ${dec}: siluetas que saludan`);
    ok(r.elecciones.length === 1 && r.elecciones[0].id === 'guardia-resp', `guardia-molino con coihue ${dec}: pregunta cómo respondés al saludo`);
  }
  const gb = correrEscena(ESCENAS_ACTO2['guardia-molino'], { decisiones: { coihue: 'b' } });
  ok(quienes(gb).includes('duende:pillos-bellotas') && quienes(gb).includes('raro:noche-piedritas') && !quienes(gb).includes('duende:siluetas-saludan') && gb.elecciones[0]?.id === 'guardia-tocon', 'guardia-molino con el coihue talado: la noche de las piedritas');
  ok(corrio('guardia-molino', { decisiones: { coihue: 'a' }, script: [2] }, 'duende:siluetas-corren') && noCorrio('guardia-molino', { decisiones: { coihue: 'a' }, script: [0] }, 'duende:siluetas-corren'), 'guardia-molino: pararte de golpe las espanta');
  ok(correrEscena(ESCENAS_ACTO2['guardia-molino'], { decisiones: { coihue: 'a' } }).mundo.horas.length >= 2, 'guardia-molino cambia la hora (la noche corre)');
  // el lago y la foto
  ok(corrio('el-que-vuela', { script: [0] }, 'objeto:foto-movida', 'raro:foto-movida', 'raro:lechucero-faro', 'duende:lechucero-vuela', 'duende:enjambre-lago') && noCorrio('el-que-vuela', { script: [1] }, 'objeto:foto-movida', 'raro:foto-movida'), 'el-que-vuela: sólo sale la foto si la sacás');
  // las cosas perdidas, la masa y Sofía
  ok(corrio('perdidas-devueltas', { script: [2] }, 'lazo:ercilia:1') && noCorrio('perdidas-devueltas', { script: [0] }, 'lazo:ercilia:1'), 'perdidas-devueltas: la respuesta cuidadosa sube a Ercilia');
  ok(corrio('masa-crece', {}, 'mundo:horno-se-cierra', 'mundo:receta-pan-casero', 'dar:pan-casero:2', 'lazo:rosa:1', 'raro:masa-crece'), 'masa-crece: el horno se cierra, Rosa +1, el pan casero');
  ok(corrio('foto-sofia', {}, 'raro:foto-ojo'), 'foto-sofia anota el ojo');
  // D3: elegir guarda la decisión; las tres entregas suman lo del guion
  for (const [i, v] of [[0, 'a'], [1, 'b'], [2, 'c']]) {
    const r = correrEscena(ESCENAS_ACTO2['primera-molienda'], { script: [i] });
    ok(r.corridos.filter((x) => x.nombre.startsWith('decision:')).map((x) => x.nombre).join() === `decision:molienda:${v}`, `primera-molienda opción ${i} guarda decision:molienda:${v}`);
  }
  ok(corrio('molienda-fletes', {}, 'decision:molienda:a', 'ramal:4', 'lazo:guarda:1', 'lazo:graciela:2', 'lazo:ercilia:-1'), 'molienda-fletes: ramal +4, Elsa +1, Graciela +2, Ercilia −1');
  ok(corrio('molienda-fiado', {}, 'decision:molienda:b', 'lazo:ercilia:2', 'raro:fiado-invierno') && noCorrio('molienda-fiado', {}, 'ramal:4'), 'molienda-fiado: Ercilia +2 y el ramal no suma');
  ok(corrio('molienda-partir', {}, 'decision:molienda:c', 'ramal:2', 'lazo:ercilia:1', 'lazo:graciela:1', 'mundo:bolsa-a-la-raiz'), 'molienda-partir: ramal +2, bolsa a la raíz');
  const mt = correrEscena(ESCENAS_ACTO2['molienda-partir'], { decisiones: { coihue: 'b' } });
  const mr = correrEscena(ESCENAS_ACTO2['molienda-partir'], { decisiones: { coihue: 'a' } });
  ok(mt.lineas.some((l) => /tocón/.test(l)) && !mr.lineas.some((l) => /tocón/.test(l)) && mt.lineas.some((l) => /Una aparte/.test(l)), 'molienda-partir: con el tocón la escena cambia el tono');
  // la minga, Fermín y el galpón
  ok(corrio('minga-aldea', { script: [1] }, 'lazo:ercilia:1') && noCorrio('minga-aldea', { script: [0] }, 'lazo:ercilia:1'), 'minga: repartir comida sube a Ercilia');
  ok(corrio('fermin-mulas', {}, 'lazo:fermin:1', 'mundo:fermin-oferta-sabida'), 'fermin-mulas: Fermín +1 y la oferta queda sabida');
  for (const i of [0, 1]) ok(corrio('galpon-ronda', { script: [i] }, 'objeto:cuaderno-eusebio'), `galpon-ronda: el cuaderno llega a la mochila (opción ${i})`);
  // capítulo 8
  ok(corrio('libreta-fiado', { script: [0] }, 'lazo:ercilia:1', 'raro:libreta-raiz') && noCorrio('libreta-fiado', { script: [1] }, 'lazo:ercilia:1'), 'libreta-fiado: agradecer el aviso sube a Ercilia');
  ok(corrio('cuaderno-abuelo', { script: [1] }, 'lazo:ema:1') && noCorrio('cuaderno-abuelo', { script: [0] }, 'lazo:ema:1'), 'cuaderno-abuelo: prometer silencio sube a Josefina');
  const ab = correrEscena(ESCENAS_ACTO2['cuaderno-abuelo'], { decisiones: { bolsa: 'c' } });
  ok(ab.lineas.some((l) => /nota de Eusebio/.test(l)) && !correrEscena(ESCENAS_ACTO2['cuaderno-abuelo'], { decisiones: { bolsa: 'a' } }).lineas.some((l) => /nota de Eusebio/.test(l)), 'cuaderno-abuelo: con la bolsa C se profundiza lo del capítulo 5');
  ok(corrio('los-del-cerro', { script: [2] }, 'lazo:belisario:1') && noCorrio('los-del-cerro', { script: [0] }, 'lazo:belisario:1'), 'los-del-cerro: agradecer sube a Belisario');
  // el secreto de Ramón: con buen lazo cuenta, con mal lazo se ve de lejos
  const rb = correrEscena(ESCENAS_ACTO2['secreto-ramon'], { lazos: { ramon: 2 } });
  const rm = correrEscena(ESCENAS_ACTO2['secreto-ramon'], { lazos: { ramon: -2 } });
  ok(rb.lineas.some((l) => /invierno de la ceniza/.test(l)) && quienes(rb).includes('raro:secreto-ceniza') && !quienes(rb).includes('raro:ramon-de-lejos'), 'secreto-ramon con buen lazo: cuenta el invierno de la ceniza');
  ok(!rm.lineas.some((l) => /invierno de la ceniza/.test(l)) && rm.lineas.some((l) => /de lejos/.test(l)) && quienes(rm).includes('raro:ramon-de-lejos') && rm.elecciones.length === 0, 'secreto-ramon con mal lazo: lo ves de lejos, sin charla');
  ok(corrio('secreto-ramon', { lazos: { ramon: 2 }, script: [0] }, 'lazo:ramon:1'), 'secreto-ramon: guardar el secreto sube a Ramón');
  // D4: las tres ramas del fogón
  const fa = quienes(correrEscena(ESCENAS_ACTO2['fogon-leyenda'], { script: [0] }));
  const fb = quienes(correrEscena(ESCENAS_ACTO2['fogon-leyenda'], { script: [1] }));
  const fc = quienes(correrEscena(ESCENAS_ACTO2['fogon-leyenda'], { script: [2] }));
  ok(['decision:cuaderno:a', 'lazo:ercilia:2', 'lazo:herminia:1', 'lazo:ema:-1'].every((x) => fa.includes(x)) && !fa.includes('lazo:ema:2') && !fa.includes('ramal:1'), 'fogón A (contar): Ercilia +2, Herminia +1, Josefina −1');
  ok(['decision:cuaderno:b', 'lazo:ema:2', 'lazo:ramon:1'].every((x) => fb.includes(x)) && !fb.includes('lazo:ercilia:2') && !fb.includes('lazo:ema:-1'), 'fogón B (callar): Josefina +2, Ramón +1');
  ok(['decision:cuaderno:c', 'lazo:ema:1', 'lazo:graciela:1', 'ramal:1'].every((x) => fc.includes(x)) && !fc.includes('lazo:ema:2'), 'fogón C (universidad): Josefina +1, Graciela +1, ramal +1');
  const lf = (i) => correrEscena(ESCENAS_ACTO2['fogon-leyenda'], { script: [i] }).lineas.join(' | ');
  ok(/Ochenta y nueve años/.test(lf(0)) && !/Ochenta y nueve años/.test(lf(1)) && !/Ochenta y nueve años/.test(lf(2)), 'fogón: sólo en la rama A Herminia dice lo de los ochenta y nueve años');
  ok(/figura en la planilla/.test(lf(2)) && !/figura en la planilla/.test(lf(0)), 'fogón: sólo en la rama C Graciela habla de la planilla');
  // las optativas
  ok(corrio('trigo-abuelo', {}, 'lazo:ema:1', 'raro:foto-carro-abuelo') && corrio('tablas-tito', {}, 'mundo:vender-tablas') && corrio('truchas-nicanor', {}, 'lazo:nicanor:1'), 'las optativas del capítulo 5 suman lo suyo');
  ok(corrio('veta-vuelve', {}, 'mundo:cantos-veta', 'objeto:cantos-blancos', 'lazo:tobias:1') && corrio('mulas-belisario', {}, 'lazo:belisario:1', 'raro:zaino-yegua') && corrio('herminia-noventa', {}, 'objeto:llavecita', 'lazo:herminia:2'), 'las optativas del capítulo 8 suman lo suyo');
  // las tres páginas del cuaderno y la libreta anotan lo raro
  ok(['cuaderno-1', 'cuaderno-2', 'cuaderno-3'].every((id, k) => corrio(id, {}, ['raro:cuaderno-cuentas', 'raro:lista-dejaron', 'raro:frase-del-cerro'][k])), 'cada página del cuaderno anota su indicio');
}

// ---------------------------------------------------------------- tarjetas y charla (funciones de consulta)
{
  // el cierre del 5 por D2, del 6 por D2, del 7 por D3 y del 8 por D4
  const dif = (n, d) => new Set(['a', 'b', 'c'].map((v) => cierreDe2(n, { [d]: v }).at(-1))).size === 3 && cierreDe2(n, {}).length === TEXTO_ACTO2.capitulos[n].cierre.base.length && cierreDe2(n, { [d]: null }).length === TEXTO_ACTO2.capitulos[n].cierre.base.length;
  ok(dif(5, 'coihue') && dif(6, 'coihue') && dif(7, 'molienda') && dif(8, 'cuaderno'), 'los cierres de los capítulos 5 a 8 cambian con la decisión y sin decisión son la base');
  ok(/tocón ancho como una mesa/.test(cierreDe2(5, { coihue: 'b' }).at(-1)) && /pirca de Tobías/.test(cierreDe2(5, { coihue: 'c' }).at(-1)) && /en pie/.test(cierreDe2(5, { coihue: 'a' }).at(-1)), 'cierre del 5 con el coihue A, B y C');
  ok(/primera nieve/.test(cierreDe2(8, { cuaderno: 'a' }).join(' ')) && cierreDe2(9).length === 0, 'cierre del 8 nombra la primera nieve; capítulo inexistente vacío');
  // la entrada: la puerta de estación y las variantes
  ok(entradaDe2(5, {}, { puerta: 'temprano' }).length === 1 && /lengas todavía están verdes/.test(entradaDe2(5, {}, { puerta: 'temprano' })[0]), 'entrada del 5 antes de tiempo: la tarjeta corta de espera');
  ok(entradaDe2(5, {}, { puerta: 'tarde' }).length === entradaDe2(5).length + 1 && /vino crecido/.test(entradaDe2(5, {}, { puerta: 'tarde' })[0]), 'entrada del 5 a destiempo: el arroyo vino crecido');
  ok(new Set(['a', 'b', 'c'].map((v) => entradaDe2(6, { bolsa: v }).at(-1))).size === 3 && entradaDe2(6, { bolsa: 'a' }).length === 3 && entradaDe2(6, {}).length === 2, 'entrada del 6 con una frase por la bolsa del acto I');
  ok(new Set(['a', 'b', 'c'].map((v) => entradaDe2(7, { coihue: v }).at(-1))).size === 3 && new Set(['a', 'b', 'c'].map((v) => entradaDe2(8, { molienda: v }).at(-1))).size === 3, 'entradas del 7 y el 8 con una frase por el coihue y la molienda');
  // el premio
  ok(/leña/.test(premioDe2(8, { cuaderno: 'a' })) && /poncho/.test(premioDe2(8, { cuaderno: 'b' })) && /flete/.test(premioDe2(8, { cuaderno: 'c' })) && !/poncho|leña|flete/.test(premioDe2(8, {})), 'el premio del 8 según el cuaderno (leña, poncho, flete)');
  ok(/lámpara de aceite/.test(premioDe2(6)) && /cuaderno de Eusebio/.test(premioDe2(7)) && /harina/.test(premioDe2(5)), 'premios de los capítulos 5, 6 y 7');
  // la página de tratos
  ok(paginaTratosDe2({}).length === 1 && paginaTratosDe2({ bolsa: 'a', coihue: 'b' }).length === 3 && /pirca/.test(paginaTratosDe2({ coihue: 'c' }).join(' ')) && /raíz del coihue grande/.test(paginaTratosDe2({ bolsa: 'a' }).join(' ')), 'la página de tratos suma una frase por cada decisión tomada');
  // la charla
  ok(charlaDe2('ramon', 5, {})?.id === 'ramon-c5-zaino' && charlaDe2('ramon', 5, { decisiones: { coihue: 'b' } })?.id === 'ramon-c5-talado', 'charla de Ramón en el capítulo 5, con y sin tala');
  ok(charlaDe2('ramon', 7, {})?.id === 'ramon-c7-minga' && charlaDe2('ramon', 8, {})?.id === 'ramon-c8-nieve', 'en cada capítulo gana la línea más nueva');
  ok(charlaDe2('josefina', 8, { decisiones: { cuaderno: 'a' } })?.id === 'josefina-c8-contar' && charlaDe2('josefina', 8, { decisiones: { cuaderno: 'c' } })?.id === 'josefina-c8-carta' && charlaDe2('josefina', 8, {})?.cap === 7, 'Josefina habla distinto después del fogón; sin decisión sigue la del 7');
  ok(charlaDe2('nicanor', 6, { escenas: ['el-que-vuela'] })?.id === 'nicanor-c6-foto' && charlaDe2('nicanor', 6, {})?.id === 'nicanor-c6-luces', 'Nicanor habla de la foto sólo si viste al que vuela');
  ok(charlaDe2('rosa', 6, { optativas: ['masa-crece'], decisiones: { bolsa: 'b' } })?.cap === 6 && charlaDe2('fermin', 7, { optativas: ['fermin-habla'] })?.id === 'fermin-c7-habla', 'las optativas cambian la charla');
  ok(charlaDe2('nadie', 6, {}) === null && charlaDe2('tito', 4, {}) === null, 'sin charla para quien no está o antes de tiempo');
  ok(Object.hasOwn(TEXTO_ACTO2.charla, 'constructor') === false && Object.hasOwn(TEXTO_ACTO2.capitulos, 'constructor') === false, 'sin claves peligrosas');
}

// ---------------------------------------------------------------- los pedidos para el agente A están anotados, y los módulos son seguros para el empaquetador
{
  const cambios = existsSync(join(raiz, 'CAMBIOS_4_16_0_B.md')) ? leer('CAMBIOS_4_16_0_B.md') : '';
  ok(cambios.length > 2000, 'existe CAMBIOS_4_16_0_B.md');
  for (const id of IDS_ACTO2) ok(cambios.includes('`' + id + '`'), `CAMBIOS_4_16_0_B.md lista la escena «${id}» en la tabla de ids`);
  for (const nombre of EFECTOS_ACTO2.map((x) => x.split(':')[0]).filter((x, i, a) => a.indexOf(x) === i)) ok(cambios.includes(`${nombre}:`), `CAMBIOS_4_16_0_B.md documenta la convención «${nombre}:»`);
  for (const cond of CONDICIONES_HISTORIA) ok(cambios.includes(cond), `CAMBIOS_4_16_0_B.md documenta la condición «${cond}»`);
  for (const nombre of EFECTOS_ACTO2.filter((x) => x.startsWith('duende:') || x.startsWith('mundo:'))) ok(cambios.includes('`' + nombre + '`'), `CAMBIOS_4_16_0_B.md documenta el efecto «${nombre}»`);
  ok(!/scratch/i.test(cambios), 'los cambios no mencionan lo que no se menciona');
  const modulos = ['src/historia-escenas-acto2.js', 'src/historia-escenas-acto2-util.js', 'src/historia-escenas-acto2-c5.js', 'src/historia-escenas-acto2-c6.js', 'src/historia-escenas-acto2-c7.js', 'src/historia-escenas-acto2-c8.js', 'src/historia-texto-acto2.js'];
  for (const a of modulos) {
    const t = leer(a);
    for (const m of t.matchAll(/^export\s+(?:const|let|var|function|class)\s+([^\s=(]+)/gm)) ok(/^[A-Za-z0-9_$]+$/.test(m[1]), `${a}: el nombre exportado «${m[1]}» tiene caracteres raros (ñ o acentos)`);
    ok(!/^export\s*\{/m.test(t) && !/^export\s+(?:async\s+)?function\*/m.test(t) && !/^export\s+async/m.test(t) && !/^export\s+\*/m.test(t), `${a}: sólo exports que entiende armar.mjs`);
    ok(!/^export\s+const\s+[^=\n]+,\s*[A-Za-z_$][\w$]*\s*=/m.test(t), `${a}: un export const por nombre`);
    for (const m of t.matchAll(/^import\s.*$/gm)) ok(/^import\s+\{[^}]+\}\s+from\s+'\.\/[a-z0-9-]+\.js';$/.test(m[0]), `${a}: import en una sola línea: ${m[0].slice(0, 60)}`);
    ok(!t.includes('\r'), `${a}: fines de línea LF`);
    ok(!/\b(three|THREE|document|window)\b/.test(t.replace(/\/\/.*$/gm, '')), `${a}: puro (sin three ni DOM)`);
    ok(!/scratch/i.test(t), `${a}: no menciona lo que no se menciona`);
    ok(!/[\x08]/.test(t), `${a}: sin retrocesos sueltos (barras invertidas perdidas)`);
  }
  // los nombres exportados no chocan con los del acto I (el que los importa los junta en un solo módulo)
  const a1 = leer('src/historia-escenas-acto1.js') + leer('src/historia-texto-acto1.js');
  for (const a of ['src/historia-escenas-acto2.js', 'src/historia-texto-acto2.js']) for (const m of leer(a).matchAll(/^export\s+(?:const|function)\s+([A-Za-z0-9_$]+)/gm)) ok(!new RegExp(`^export\\s+(?:const|function)\\s+${m[1]}\\b`, 'm').test(a1), `${a}: el nombre «${m[1]}» ya existe en el acto I`);
  ok(Object.keys(POSE_DE).length >= 15 && Object.values(POSE_DE).every((p) => POSES_ESCENA.includes(p)), 'la tabla de gestos del guion sólo apunta a poses que existen');
  ok(Object.values(PERSONAJES_ACTO2).every((p) => typeof p.nombre === 'string' && Object.hasOwn(p, 'clave') && /^#[0-9a-f]{6}$/i.test(p.color)), 'los personajes del acto II están completos');
  ok(MAX_OPCIONES >= 3, 'el motor admite 3 opciones');
}

// ---------------------------------------------------------------- MUTACIONES: se rompe una garantía de los datos y la suite tiene que fallar
const clon = (o) => JSON.parse(JSON.stringify(o));
function mutante(tocar) {
  const e = clon(ESCENAS_ACTO2), t = clon(TEXTO_ACTO2), fu = { claves: new Set(CLAVES), lugares: new Set(LUGARES), disparo: clon(DISPARO_ACTO2), textoJuego: fuentes.textoJuego };
  tocar(e, t, fu);
  return suite(e, t, fu);
}
const primeroDialogo = (e) => e.pasos.find((p) => p.tipo === 'dialogo');
const eleccionDe = (e, id) => e.pasos.find((p) => p.tipo === 'eleccion' && p.id === id);
const MUTACIONES = [
  ['falta una escena', (e) => { delete e['herminia-noventa']; }],
  ['una escena de más', (e) => { e['extra-uno'] = { ...clon(e['foto-sofia']), id: 'extra-uno' }; }],
  ['el id no coincide con la clave', (e) => { e['cuaderno-2'].id = 'cuaderno-dos'; }],
  ['un id que choca con el acto I', (e) => { const x = clon(e['foto-sofia']); delete e['foto-sofia']; e['bolsa-alero'] = { ...x, id: 'bolsa-alero' }; }],
  ['un plano desconocido', (e) => { e['rueda-gira'].pasos.find((p) => p.tipo === 'plano').plano = 'cenital'; }],
  ['un paso sin tipo', (e) => { e['pluma-umbral'].pasos.push({ tipo: 'volar' }); }],
  ['una opción sin efecto ni sabor', (e) => { delete eleccionDe(e['zaino-ramon'], 'zaino-resp').opciones[0].sabor; }],
  ['una opción con efecto y sabor', (e) => { eleccionDe(e['zaino-ramon'], 'zaino-resp').opciones[2].sabor = true; }],
  ['cuatro opciones', (e) => { eleccionDe(e['tito-coihue'], 'coihue').opciones.push({ id: 'd', texto: 'Prenderle fuego.', sabor: true }); }],
  ['una línea larguísima', (e) => { primeroDialogo(e['libreta-fiado']).lineas[0] = 'Hola. ' + 'muy largo '.repeat(40); }],
  ['una opción larguísima', (e) => { eleccionDe(e['libreta-fiado'], 'libreta-resp').opciones[0].texto = 'Gracias por el aviso y por todo lo demás que hiciste '.repeat(3); }],
  ['inglés en una línea', (e) => { primeroDialogo(e['los-del-cerro']).lineas.push('Una frase con the adentro'); }],
  ['una palabra religiosa', (e) => { primeroDialogo(e['secreto-ramon']).lineas.push('Que Dios lo bendiga, m\'hijo.'); }],
  ['una palabra explícita', (e) => { primeroDialogo(e['foto-sofia']).lineas.push('Qué sexo tan raro.'); }],
  ['una cosa que no existe en el juego', (e) => { primeroDialogo(e['molienda-fletes']).lineas.push('Graciela se fue al hospedaje.'); }],
  ['una persona que no existe', (e) => { primeroDialogo(e['perdidas-devueltas']).lineas.push('Esto me lo dijo la tía Hortensia.'); }],
  ['un hablante sin declarar', (e) => { primeroDialogo(e['zaino-ramon']).quien = 'ramoncito'; }],
  ['una clave de personaje que no existe', (e) => { e['truchas-nicanor'].personajes.nicanor.clave = 'nicanor2'; }],
  ['un lugar que no existe', (e) => { e['molienda-fletes'].pasos[1].a = { lugar: 'aeropuerto' }; }],
  ['un efecto fuera de la convención', (e) => { e['molienda-fiado'].pasos.push({ tipo: 'efecto', nombre: 'regalo:muchos' }); }],
  ['un lazo exagerado', (e) => { e['molienda-fiado'].pasos.push({ tipo: 'efecto', nombre: 'lazo:ercilia:9' }); }],
  ['una condición que no está en la convención', (e) => { e['rueda-gira'].pasos.push({ tipo: 'dialogo', quien: 'josefina', lineas: ['Hola.'], si: { cond: 'magia', args: {} } }); }],
  ['un raro sin texto', (e) => { e['rueda-gira'].pasos.push({ tipo: 'efecto', nombre: 'raro:rueda-fantasma' }); }],
  ['un objeto sin texto', (e) => { e['galpon-ronda'].pasos.push({ tipo: 'efecto', nombre: 'objeto:llave-del-79' }); }],
  ['una escena efímera', (e) => { e['el-que-vuela'].efimera = true; }],
  ['una escena sin resumen', (e) => { delete e['fermin-mulas'].resumen; }],
  ['una escena con un solo plano', (e) => { const pl = e['tablas-tito'].pasos.filter((p) => p.tipo === 'plano'); e['tablas-tito'].pasos = e['tablas-tito'].pasos.filter((p) => !pl.slice(1).includes(p)); }],
  ['una escena sin diálogo', (e) => { e['pluma-umbral'].pasos = e['pluma-umbral'].pasos.filter((p) => p.tipo !== 'dialogo' && p.tipo !== 'eleccion'); }],
  ['una pose que no existe', (e) => { e['cuaderno-1'].pasos.push({ tipo: 'gesto', quien: 'cuaderno', accion: 'posar', pose: 'volar' }); }],
  ['falta la tabla de disparo de una escena', (e, t, fu) => { delete fu.disparo['galpon-ronda']; }],
  ['un objetivo de disparo que no existe', (e, t, fu) => { fu.disparo['fogon-leyenda'].objetivo = 'no-existe'; }],
  ['el capítulo de la tabla no coincide', (e, t, fu) => { fu.disparo['minga-aldea'].cap = 8; }],
  ['el cierre del capítulo 5 sin una variante', (e, t) => { delete t.capitulos[5].cierre.segun.b; }],
  ['el cierre del capítulo 8 sin variantes', (e, t) => { delete t.capitulos[8].cierre.segun; }],
  ['el premio del capítulo 8 sin variantes', (e, t) => { delete t.capitulos[8].premio.segun; }],
  ['la puerta de estación sin la tarjeta tardía', (e, t) => { delete t.capitulos[5].puerta.tarde; }],
  ['un capítulo sin premio', (e, t) => { delete t.capitulos[6].premio.texto; }],
  ['una entrada de lo raro incompleta', (e, t) => { delete t.raro['galpon-ronda'].texto; }],
  ['una entrada de lo raro huérfana', (e, t) => { t.raro['indicio-suelto'] = { titulo: 'Suelto', texto: 'Esto no lo anota ninguna escena nunca.', cap: 6, donde: 'valle' }; }],
  ['inglés en una tarjeta', (e, t) => { t.capitulos[7].entrada.push('The valley is waiting for you'); }],
  ['religión en una nota', (e, t) => { t.notas['cuaderno-1'].texto.push('Rezá antes de abrir.'); }],
  ['un párrafo de tarjeta enorme', (e, t) => { t.capitulos[8].cierre.base.push('Muy largo. '.repeat(60)); }],
  ['un vecino sin charla', (e, t) => { t.charla.tobias = []; }],
  ['una nota que falta', (e, t) => { delete t.notas['libreta-raiz']; }],
  ['la decisión del coihue sin una opción', (e) => { eleccionDe(e['tito-coihue'], 'coihue').opciones[2].efecto = 'decision:coihue:a'; }],
  ['la decisión de la molienda con otro defecto', (e) => { eleccionDe(e['primera-molienda'], 'molienda').porDefecto = 0; }],
  ['la decisión del cuaderno sin efecto en una opción', (e) => { delete eleccionDe(e['fogon-leyenda'], 'cuaderno').opciones[1].efecto; eleccionDe(e['fogon-leyenda'], 'cuaderno').opciones[1].sabor = true; }],
  ['una elección repetida entre escenas', (e) => { eleccionDe(e['rueda-gira'], 'rueda-resp').id = 'zaino-resp'; }],
  ['un paso que mira una elección inexistente', (e) => { e['rueda-gira'].pasos.push({ tipo: 'dialogo', quien: 'josefina', lineas: ['Hola.'], si: { eleccion: 'no-hay', es: 'a' } }); }],
  ['un duende de un tipo que no existe', (e) => { e['el-que-vuela'].pasos.push({ tipo: 'efecto', nombre: 'duende:volador-raro', args: { tipo: 'dragon' } }); }],
  ['una elección que salta a una etiqueta inexistente', (e) => { eleccionDe(e['zaino-ramon'], 'zaino-resp').opciones[0].a = 'nunca'; }],
];
let atrapadas = 0;
for (const [nombre, tocar] of MUTACIONES) {
  const fs_ = mutante(tocar);
  if (fs_.length) atrapadas++; else console.log('NO ATRAPÓ la mutación: ' + nombre);
  ok(fs_.length > 0, `la prueba atrapa la mutación «${nombre}»`);
}
ok(atrapadas === MUTACIONES.length && MUTACIONES.length >= 40, `atrapó ${atrapadas} de ${MUTACIONES.length} mutaciones`);
// la suite sobre los datos reales no se rompe por sí sola: una copia exacta pasa
ok(mutante(() => {}).length === 0, 'una copia exacta de los datos pasa la suite');

console.log(fallas ? `FALLARON ${fallas} de ${n}` : `verificar-4-16-0-escenas-acto2: ${n} comprobaciones OK (${totalCaminos} caminos, ${totalCorridas} corridas, ${MUTACIONES.length} mutaciones atrapadas)`);
process.exit(fallas ? 1 : 0);
