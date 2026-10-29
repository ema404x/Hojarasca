// 4.15.0 (B): las escenas y los textos del ACTO I de la Historia (src/historia-escenas-acto1.js, historia-texto-acto1.js,
// historia-escenas-util.js). Sólo Node. Las escenas son datos: la prueba las valida con el director real (escenas.js), las corre de punta a
// punta por TODOS los caminos de elección con un mundo de mentira, las salta, y revisa los textos (cabe en el cuadro, sin inglés, sin
// palabras religiosas ni explícitas, que no nombren nada que no exista en el juego). Al final hay MUTACIONES de los datos (se rompe una
// garantía a propósito) y la prueba tiene que atraparlas todas.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { ESCENAS_ACTO1, IDS_ACTO1, EFECTOS_ACTO1, DISPARO_ACTO1 } from '../src/historia-escenas-acto1.js';
import { TEXTO_ACTO1, cierreDe, premioDe, charlaDe } from '../src/historia-texto-acto1.js';
import { parsearEfecto, efectosDe, condicionesDe, CONDICIONES_HISTORIA, PERSONAJES_HISTORIA, POSE_DE } from '../src/historia-escenas-util.js';
import { crearDirector, validarEscena, PERSONAJES_BASE, POSES_ESCENA, MAX_OPCIONES } from '../src/escenas.js';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => readFileSync(join(raiz, f), 'utf8');
let n = 0, fallas = 0;
const ok = (c, t) => { n++; if (!c) { fallas++; console.log('FALLA ' + t); } };

const IDS_PEDIDOS = ['trochita-boleto', 'estacion-llegada', 'algo-cruza', 'nota-eusebio', 'ronda-umbral', 'ramon-tranquera', 'almacen-ercilia', 'ese-no-josefina', 'bolsa-alero', 'bolsa-coihue', 'bolsa-rosa', 'bolsa-josefina', 'hacha-tocon', 'placa-herminia', 'mesa-visita-nicanor', 'mesa-visita-ramon', 'fermin-galpon', 'anden-graciela', 'cabina-elsa', 'derrumbe-puertita', 'te-graciela'];
// lo que el guion usa y todavía no existe en el juego (va como pedido para el agente A en CAMBIOS_4_15_0_B.md): se tolera, pero tiene que estar anotado
const CLAVES_PEDIDAS = ['graciela'];
// los nombres propios que el texto puede usar en medio de una frase: personas y lugares que existen (o que el guion trae a propósito: Eusebio, Graciela)
const NOMBRES_OK = new Set(['Administración', 'Aires', 'Aldea', 'Arroyo', 'Aurelio', 'Belisario', 'Buenos', 'Don', 'Duendes', 'Elsa', 'Ercilia', 'Esquel', 'Estación', 'Eusebio', 'Fermín', 'Graciela', 'Herminia', 'Josefina', 'Nicanor', 'Nélida', 'Pugh', 'Ramal', 'Ramón', 'Refugio', 'Rosa', 'Trevelin', 'Valle', 'Bariloche', 'Gales', 'Ernesto']);
const PERSONAS_REALES = ['Aurelio', 'Belisario', 'Herminia', 'Rosa', 'Fermín', 'Nélida', 'Ernesto', 'Nicanor', 'Ramón', 'Josefina', 'Ercilia', 'Elsa'];
const MAX_LINEA = 260;      // letras por línea de diálogo: cabe en cuatro renglones del cuadro (840 px, 21 px)
const MAX_OPCION = 96;      // una opción de elección (un botón)
const MAX_PREGUNTA = 72;
const MAX_PARRAFO = 420;    // un párrafo de tarjeta

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
  for (const p of e.pasos || []) {
    if (p.tipo === 'dialogo') { r.add(p.quien); for (const l of Array.isArray(p.lineas) ? p.lineas : []) if (l && l.quien) r.add(l.quien); }
    if (p.tipo === 'gesto') r.add(p.quien);
  }
  return r;
}

// ---------------------------------------------------------------- un mundo de mentira
function mundoFalso() {
  const claves = ['guarda', 'ramon', 'ema', 'ercilia', 'nicanor', 'nelida', 'jefe', 'abuela', 'panadera', 'fermin', 'graciela'];
  const actores = {};
  claves.forEach((k, i) => { actores[k] = { x: 30 + i * 3, y: 0, z: -20 - i * 2, meta: null, vel: 1.4, capt: false, visible: true }; });
  const lugares = { refugio: { x: -120, z: 232 }, estacion: { x: 300, z: 90 }, almacen: { x: 60, z: 40 }, galpon: { x: 228, z: -110 }, mirador: { x: -292, z: 36 }, molino: { x: -80, z: 120 } };
  const w = {
    actores, hv: 18, sonidos: [], posadas: [], tele: [], libres: [], empezo: 0, termino: 0, planosSinRef: 0,
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
    hora(h) { w.hv = h; },
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
// `decisiones`: la historia (D1…). Devuelve { log, efectos, lineas, planos, errores, vista, terminó… }
function correrEscena(escena, { script = [], decisiones = {}, eventos = [], saltarAl = -1, extras = [], ausentes = [] } = {}) {
  const mundo = mundoFalso();
  const est = { vistas: {}, elecciones: {} };
  const corridos = [];
  const dec = { ...decisiones };
  const resultados = [];
  const efectos = {};
  for (const nombre of EFECTOS_ACTO1) {
    efectos[nombre] = (args, ctx) => {
      corridos.push({ nombre, args, saltando: ctx.saltando });
      const p = parsearEfecto(nombre);
      if (p && p.tipo === 'decision') dec[p.d] = p.v;
    };
  }
  const condiciones = {
    decision: (c) => (dec[c.args.d] ?? 'ninguna') === c.args.es,
    lazo: () => true,
    evento: (c) => eventos.includes(c.args.id),
    presente: (c) => !ausentes.includes(c.args.quien),   // (4.16.0)
  };
  const dir = crearDirector({ mundo, estado: () => est, dia: () => 2, efectos, condiciones, alTerminar: (r) => resultados.push(r) });
  for (const e of extras) dir.registrar(e);
  const reg = dir.registrar(escena);
  const log = { reg, lineas: [], hablantes: [], opciones: [], planos: new Set(), camaras: 0, elecciones: [], pasos: 0, activa: false };
  if (!reg.ok) return { ...log, mundo, corridos, resultados, dir, est, dec, falloRegistro: true };
  const faltan = dir.efectosFaltantes(escena.id);
  log.faltan = faltan;
  if (!dir.disparar(escena.id)) { log.noDisparo = true; return { ...log, mundo, corridos, resultados, dir, est, dec }; }
  let ultima = '', i = 0, k = 0;
  while (dir.activa() && i++ < 60000) {
    mundo.simular(0.05);
    dir.actualizar(0.05);
    if (saltarAl >= 0 && i === saltarAl) { dir.saltar(); continue; }
    const d = dir.datos(), cam = dir.camara();
    if (cam) { log.camaras++; log.planos.add(`${cam.x.toFixed(1)}|${cam.z.toFixed(1)}|${cam.yaw.toFixed(1)}`); }
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
  // sin repetidos (la raíz vuelve a correrse con el primer hijo)
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

  // 2) válidas con el validador del motor
  for (const e of escenas) {
    const v = validarEscena(e);
    c(v.ok, `${e?.id}: no valida (${(v.errores || []).join('; ')})`);
    c(typeof e.resumen === 'string' && e.resumen.length > 20, `${e?.id}: sin resumen para cuando se salta`);
    c(typeof e.titulo === 'string' && e.titulo.length > 2, `${e?.id}: sin título`);
    c(e.acto === 1 && e.capitulo >= 1 && e.capitulo <= 4, `${e?.id}: acto o capítulo fuera del acto I`);
    c(!e.efimera, `${e?.id}: no puede ser efímera (tiene que quedar vista)`);
  }

  // 3) la cámara: planos reales (al menos dos por escena, o un plano y planos dentro de las líneas)
  for (const e of escenas) {
    const planos = e.pasos.filter((p) => p.tipo === 'plano').length + e.pasos.filter((p) => p.tipo === 'dialogo').reduce((s, p) => s + (Array.isArray(p.lineas) ? p.lineas.filter((l) => l && l.plano).length : 0), 0);
    c(planos >= 1, `${e.id}: sin planos de cámara`);
    c(e.pasos.some((p) => p.tipo === 'dialogo') || e.id === 'algo-cruza', `${e.id}: sin diálogo`);
  }
  c(ESC['algo-cruza'] && !ESC['algo-cruza'].pasos.some((p) => p.tipo === 'dialogo'), 'algo-cruza no lleva texto (el guion lo pide mudo)');

  // 4) efectos y condiciones: la convención de nombres
  for (const e of escenas) {
    for (const nombre of efectosDe(e)) c(parsearEfecto(nombre), `${e.id}: el efecto «${nombre}» no sigue la convención`);
    for (const cond of condicionesDe(e)) c(CONDICIONES_HISTORIA.includes(cond), `${e.id}: la condición «${cond}» no está en la convención`);
  }
  const usados = new Set(escenas.flatMap((e) => efectosDe(e)));
  c([...usados].every((x) => EFECTOS_ACTO1.includes(x)) || ESC !== ESCENAS_ACTO1, 'EFECTOS_ACTO1 no cubre los efectos usados');

  // 5) las elecciones: cada opción tiene efecto, salta, o es de sabor declarado
  let totalElecciones = 0, conEfecto = 0;
  for (const e of escenas) {
    for (const p of e.pasos.filter((q) => q.tipo === 'eleccion')) {
      totalElecciones++;
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
  c(totalElecciones >= 15, 'pocas elecciones en todo el acto (' + totalElecciones + ')');
  c(conEfecto >= 6, 'pocas elecciones con efecto (' + conEfecto + ')');

  // 6) los hablantes están declarados y existen en el juego
  for (const e of escenas) {
    const decl = { ...PERSONAJES_BASE, ...(e.personajes || {}) };
    for (const q of hablantesUsados(e)) c(q && Object.hasOwn(decl, q), `${e.id}: hablante o actor sin declarar «${q}»`);
    for (const [k, pj] of Object.entries(e.personajes || {})) {
      if (pj.clave) c(fuentes.claves.has(pj.clave) || CLAVES_PEDIDAS.includes(pj.clave), `${e.id}: «${k}» usa la clave «${pj.clave}» que no existe en el juego`);
      c(typeof pj.nombre === 'string' && /^#[0-9a-f]{6}$/i.test(pj.color || ''), `${e.id}: personaje «${k}» sin nombre o color`);
    }
    for (const p of e.pasos) if (p.tipo === 'gesto' && p.accion === 'posar') c(POSES_ESCENA.includes(p.pose), `${e.id}: pose «${p.pose}» que el motor no sabe`);
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

  // 8) las tarjetas del acto I
  for (const num of [1, 2, 3, 4]) {
    const cap = TEX.capitulos?.[num];
    c(!!cap, `falta el capítulo ${num}`);
    if (!cap) continue;
    c(cap.entrada?.length >= 2 && cap.entrada.every((p) => p.length > 30), `capítulo ${num}: entrada incompleta`);
    c(cap.cierre?.base?.length >= 1, `capítulo ${num}: sin cierre`);
    c(cap.objetivos?.length >= 5 && cap.objetivos.every((o) => o.id && o.texto && o.tecla), `capítulo ${num}: objetivos incompletos`);
    c(cap.premio?.texto && cap.premio.texto.length > 10, `capítulo ${num}: sin premio en texto`);
    c(cap.acto === 1 && cap.dia === num, `capítulo ${num}: acto o día mal`);
  }
  const cierre2 = TEX.capitulos?.[2]?.cierre;
  c(cierre2?.segun && cierre2.segun.d === 'bolsa' && ['a', 'b', 'c'].every((v) => typeof cierre2.segun[v] === 'string' && cierre2.segun[v].length > 20), 'el cierre del capítulo 2 no tiene las tres variantes de la bolsa');
  const raros = TEX.raro || {};
  for (const [id, r] of Object.entries(raros)) {
    c(parsearEfecto(`raro:${id}`), `raro «${id}»: id fuera de la convención`);
    c(typeof r.texto === 'string' && r.texto.length > 15 && typeof r.titulo === 'string' && r.cap >= 1 && r.cap <= 4 && typeof r.donde === 'string', `raro «${id}»: entrada incompleta`);
  }
  // cada raro / objeto que una escena anota existe en los textos
  for (const nombre of usados) {
    const p = parsearEfecto(nombre);
    if (!p) continue;
    if (p.tipo === 'raro') c(Object.hasOwn(raros, p.id), `raro «${p.id}» usado por una escena y sin texto`);
    if (p.tipo === 'objeto' || p.tipo === 'entrega') c(Object.hasOwn(TEX.objetos || {}, p.id), `objeto «${p.id}» usado por una escena y sin texto`);
  }
  // los lazos y decisiones del guion: la bolsa tiene sus tres caminos, y sólo ellos tocan los lazos pedidos
  c(['a', 'b', 'c'].every((v) => usados.has(`decision:bolsa:${v}`)), 'la decisión de la bolsa no tiene las tres opciones');
  const elBolsa = ESC['bolsa-alero']?.pasos.find((p) => p.tipo === 'eleccion' && p.id === 'bolsa');
  c(!!elBolsa && elBolsa.opciones.length === 3 && elBolsa.opciones.every((o) => o.efecto === `decision:bolsa:${o.id}`), 'bolsa-alero: cada opción de la bolsa guarda su propia decisión');
  // la charla de los vecinos
  const vecinos = ['ramon', 'nicanor', 'josefina', 'ercilia', 'fermin', 'herminia', 'rosa', 'elsa'];
  for (const v of vecinos) {
    const l = TEX.charla?.[v];
    c(Array.isArray(l) && l.length >= 2, `charla: ${v} tiene menos de dos líneas`);
    for (const x of l || []) c(x.id && x.cap >= 1 && x.cap <= 4 && typeof x.texto === 'string' && x.texto.length > 20 && x.texto.length <= MAX_LINEA, `charla ${v}/${x.id}: línea inválida`);
  }
  const idsCharla = vecinos.flatMap((v) => (TEX.charla?.[v] || []).map((x) => x.id));
  c(new Set(idsCharla).size === idsCharla.length, 'charla: ids repetidos');

  // 9) la tabla de disparo cubre todas las escenas
  for (const id of ids) {
    const d = fuentes.disparo?.[id];
    c(!!d && d.cap >= 1 && typeof d.jugadorEn === 'string' && typeof d.cuando === 'string', `${id}: sin datos de disparo`);
  }
  return f;
}

const fuentes = { claves: CLAVES, lugares: LUGARES, disparo: DISPARO_ACTO1, textoJuego: FUENTES.aldea + FUENTES.gente + FUENTES.campo };
const reales = suite(ESCENAS_ACTO1, TEXTO_ACTO1, fuentes);
ok(reales.length === 0, 'la suite de datos pasa: ' + reales.slice(0, 12).join(' | ') + (reales.length > 12 ? ` (+${reales.length - 12})` : ''));
ok(IDS_ACTO1.length === 21, '21 escenas');
// 4.16.0: la opción de Rosa sólo se ofrece si Rosa ya vive en la aldea
{
  const con = correrEscena(ESCENAS_ACTO1['bolsa-alero'], { script: [1] });
  ok(con.elecciones.length === 1 && con.elecciones[0].n === 3 && con.dec.bolsa === 'b', 'con Rosa en la aldea, la bolsa tiene tres opciones y la B es llevarla a Rosa');
  const sin = correrEscena(ESCENAS_ACTO1['bolsa-alero'], { script: [1], ausentes: ['rosa'] });
  ok(sin.elecciones.length === 1 && sin.elecciones[0].n === 2 && sin.dec.bolsa === 'c', 'sin Rosa, la bolsa tiene dos opciones (convidar o Josefina) y ninguna es Rosa');
  const saltada = correrEscena(ESCENAS_ACTO1['bolsa-alero'], { ausentes: ['rosa'], saltarAl: 3 });
  ok(saltada.dec.bolsa === 'a', 'sin Rosa, saltar la escena toma la opción por defecto (convidar)');
}

// ---------------------------------------------------------------- las escenas corren (todos los caminos) y se saltan
let totalCaminos = 0, totalLineas = 0;
for (const [id, e] of Object.entries(ESCENAS_ACTO1)) {
  const camsRaiz = caminos(e);
  totalCaminos += camsRaiz.length;
  ok(camsRaiz.length >= 1, `${id}: se corre`);
  for (const { script, r } of camsRaiz) {
    const rot = `${id} [${script.join(',')}]`;
    ok(!r.falloRegistro && !r.noDisparo, `${rot}: registra y dispara`);
    ok(r.faltan?.length === 0, `${rot}: efectos sin registrar (${r.faltan})`);
    ok(!r.activa, `${rot}: termina`);
    ok(r.resultados.length === 1 && r.resultados[0].errores.length === 0, `${rot}: sin errores del director (${r.resultados[0]?.errores?.join('; ')})`);
    ok(r.dir.vista(id), `${rot}: queda vista`);
    ok(r.mundo.empezo === 1 && r.mundo.termino === 1, `${rot}: empieza y termina una vez`);
    ok(r.mundo.actores && Object.values(r.mundo.actores).every((a) => !a.capt), `${rot}: suelta a todos los personajes`);
    ok(r.camaras > 5, `${rot}: la cámara se movió`);
    if (e.pasos.some((p) => p.tipo === 'dialogo')) ok(r.lineas.length >= 1, `${rot}: dijo alguna línea`);
    totalLineas += r.lineas.length;
    // cada efecto de opción elegida corrió; ninguno de una opción no elegida
    for (const el of r.elecciones) {
      const paso = e.pasos.find((p) => p.tipo === 'eleccion' && p.id === el.id);
      paso.opciones.forEach((o, i) => {
        if (!o.efecto) return;
        const corrio = r.corridos.some((x) => x.nombre === o.efecto);
        if (i === el.tomada) ok(corrio, `${rot}: la opción ${o.id} no corrió su efecto ${o.efecto}`);
      });
    }
  }
  // saltar apenas empieza y a la mitad: termina, queda vista, las elecciones usan el defecto y los efectos del camino corren
  for (const cuando of [2, 40, 300]) {
    const r = correrEscena(e, { saltarAl: cuando });
    ok(!r.activa && r.dir.vista(id) && r.resultados.length === 1 && r.resultados[0].errores.length === 0, `${id}: se puede saltar a los ${cuando} cuadros`);
    ok(r.resultados[0]?.saltada === true || r.resultados[0]?.saltada === false, `${id}: resultado al saltar`);
  }
}
ok(totalCaminos >= 40, 'se corrieron muchos caminos (' + totalCaminos + ')');
ok(totalLineas >= 200, 'se dijeron muchas líneas en total (' + totalLineas + ')');

// saltar la escena de la bolsa: la decisión por defecto igual se toma (lo que tiene que valer va en pasos)
{
  const r = correrEscena(ESCENAS_ACTO1['bolsa-alero'], { saltarAl: 3 });
  ok(r.corridos.some((x) => x.nombre === 'decision:bolsa:a' && x.saltando === true), 'saltar bolsa-alero toma la decisión por defecto (convidar)');
  ok(r.corridos.some((x) => x.nombre === 'objeto:bolsa-eusebio'), 'saltar bolsa-alero igual da la bolsa');
  const r2 = correrEscena(ESCENAS_ACTO1['derrumbe-puertita'], { saltarAl: 3 });
  ok(r2.corridos.some((x) => x.nombre === 'objeto:puertita') && r2.corridos.some((x) => x.nombre === 'raro:puertita-via'), 'saltar derrumbe-puertita deja la puertita guardada');
  const r3 = correrEscena(ESCENAS_ACTO1['ronda-umbral'], { saltarAl: 3 });
  ok(r3.corridos.some((x) => x.nombre === 'raro:canto-blanco') && r3.corridos.some((x) => x.nombre === 'mundo:ronda-ramitas'), 'saltar ronda-umbral deja la ronda y anota lo raro');
  const r4 = correrEscena(ESCENAS_ACTO1['algo-cruza'], { saltarAl: 2 });
  ok(r4.corridos.some((x) => x.nombre === 'raro:algo-cruzo'), 'saltar algo-cruza anota igual el indicio');
}

// ---------------------------------------------------------------- las variantes según decisión, lazo y elección
const quienes = (r) => r.corridos.map((x) => x.nombre);
{
  // la bolsa: cada opción guarda su decisión
  for (const [i, v] of [[0, 'a'], [1, 'b'], [2, 'c']]) {
    const r = correrEscena(ESCENAS_ACTO1['bolsa-alero'], { script: [i] });
    ok(r.corridos.filter((x) => x.nombre.startsWith('decision:')).map((x) => x.nombre).join() === `decision:bolsa:${v}`, `bolsa-alero opción ${i} guarda decision:bolsa:${v}`);
  }
  // las tres entregas fijan su decisión y suman lo del guion
  const rc = correrEscena(ESCENAS_ACTO1['bolsa-coihue']);
  ok(quienes(rc).includes('decision:bolsa:a') && quienes(rc).includes('lazo:ramon:1') && quienes(rc).includes('mundo:bolsa-se-pierde'), 'bolsa-coihue: decisión A, Ramón +1 y la bolsa se pierde');
  ok(rc.mundo.sonidos.length >= 1, 'bolsa-coihue suena algo');
  const rr = correrEscena(ESCENAS_ACTO1['bolsa-rosa']);
  ok(quienes(rr).includes('decision:bolsa:b') && quienes(rr).includes('lazo:ercilia:2') && quienes(rr).includes('dar:pan-casero:3') && quienes(rr).includes('entrega:bolsa-eusebio'), 'bolsa-rosa: decisión B, Ercilia +2, pan y entrega');
  const rj = correrEscena(ESCENAS_ACTO1['bolsa-josefina']);
  ok(quienes(rj).includes('decision:bolsa:c') && quienes(rj).includes('lazo:ema:2'), 'bolsa-josefina: decisión C y Josefina +2');
  // el hacha en el tocón: piñones (A), cuchara (B), ninguno (C o sin decisión)
  for (const [dec, pin, cuch] of [['a', true, false], ['b', false, true], ['c', false, false], [undefined, false, false]]) {
    const r = correrEscena(ESCENAS_ACTO1['hacha-tocon'], { decisiones: dec ? { bolsa: dec } : {} });
    const q = quienes(r);
    ok(q.includes('mundo:pinones-en-tocon') === pin && q.includes('mundo:cuchara-en-techo') === cuch, `hacha-tocon con bolsa ${dec}: piñones ${pin}, cuchara ${cuch}`);
    ok(q.includes('mundo:hacha-en-tocon') && q.includes('raro:hacha-tocon'), `hacha-tocon con bolsa ${dec}: el hacha y lo raro`);
    ok(r.lineas.some((l) => /piñones/.test(l)) === pin && r.lineas.some((l) => /cuchara/.test(l)) === cuch, `hacha-tocon con bolsa ${dec}: el texto acompaña`);
  }
  // la placa: una frase distinta por decisión
  const esperada = { a: /Bien hecho/, b: /Pan para todos/, c: /Josefina\. Mirá vos/, ninguna: /Todavía la tenés/ };
  for (const [dec, re] of Object.entries(esperada)) {
    const r = correrEscena(ESCENAS_ACTO1['placa-herminia'], { decisiones: dec === 'ninguna' ? {} : { bolsa: dec } });
    ok(r.lineas.some((l) => re.test(l)), `placa-herminia con bolsa ${dec}: dice su frase`);
    const otras = Object.entries(esperada).filter(([k]) => k !== dec);
    ok(otras.every(([, re2]) => !r.lineas.some((l) => re2.test(l))), `placa-herminia con bolsa ${dec}: no dice las de las otras`);
    ok(quienes(r).includes('raro:puertitas-peones'), `placa-herminia con bolsa ${dec}: anota lo raro`);
  }
  // la elección de Josefina y el andén de Graciela: lazos
  ok(quienes(correrEscena(ESCENAS_ACTO1['ese-no-josefina'], { script: [2] })).includes('lazo:ema:-1'), 'ese-no: insistir baja a Josefina');
  ok(!quienes(correrEscena(ESCENAS_ACTO1['ese-no-josefina'], { script: [0] })).some((x) => x.startsWith('lazo:')), 'ese-no: hacerle caso no cambia el lazo');
  const g1 = quienes(correrEscena(ESCENAS_ACTO1['anden-graciela'], { script: [1] }));
  const g2 = quienes(correrEscena(ESCENAS_ACTO1['anden-graciela'], { script: [2] }));
  const g0 = quienes(correrEscena(ESCENAS_ACTO1['anden-graciela'], { script: [0] }));
  ok(g1.includes('lazo:graciela:1') && !g1.includes('lazo:guarda:-1'), 'anden: «Sí» sube a Graciela');
  ok(g2.includes('lazo:guarda:-1') && !g2.includes('lazo:graciela:1'), 'anden: «Todavía no sé» baja a Elsa');
  ok(!g0.some((x) => x.startsWith('lazo:')), 'anden: «Desde hace cuatro días» no mueve lazos');
  // el derrumbe: dos ramas
  const da = correrEscena(ESCENAS_ACTO1['derrumbe-puertita'], { script: [0] });
  const ds = correrEscena(ESCENAS_ACTO1['derrumbe-puertita'], { script: [1] });
  ok(quienes(da).includes('objeto:puertita') && quienes(da).includes('raro:puertita-via') && !quienes(da).includes('mundo:puertita-a-la-noche') && !quienes(da).includes('lazo:graciela:-1'), 'derrumbe: ayudar da la puertita y no resta');
  ok(!quienes(ds).includes('objeto:puertita') && quienes(ds).includes('mundo:puertita-a-la-noche') && quienes(ds).includes('lazo:graciela:-1'), 'derrumbe: seguir de largo lleva la puertita a la noche y baja a Graciela');
  ok(da.lineas.some((l) => /Guárdela usted/.test(l)) && !ds.lineas.some((l) => /Guárdela usted/.test(l)), 'derrumbe: sólo el que ayuda oye a Elsa darle la puertita');
  // la visita de Nicanor: con tobillo cambia el saludo
  const nt = correrEscena(ESCENAS_ACTO1['mesa-visita-nicanor'], { eventos: ['tobillo'] });
  const nn = correrEscena(ESCENAS_ACTO1['mesa-visita-nicanor'], { eventos: [] });
  ok(nt.lineas.some((l) => /el tobillo/.test(l)) && !nn.lineas.some((l) => /el tobillo/.test(l)), 'mesa-visita-nicanor: el saludo cambia si lo ayudaste con el tobillo');
  // la risa de Ercilia
  ok(quienes(correrEscena(ESCENAS_ACTO1['almacen-ercilia'], { script: [0] })).includes('raro:risa-lejos'), 'almacén: contar la risa anota lo raro');
  // Fermín deja una optativa y anota que ya hablaste
  ok(['hablado:fermin', 'optativa:fermin-pan'].every((x) => quienes(correrEscena(ESCENAS_ACTO1['fermin-galpon'])).includes(x)), 'fermín: anota la charla y ofrece el pan');
  // te-graciela: lazo +2 y ramal +2
  ok(['lazo:graciela:2', 'ramal:2'].every((x) => quienes(correrEscena(ESCENAS_ACTO1['te-graciela'])).includes(x)), 'te-graciela: Graciela +2 y ramal +2');
  // el cuaderno de lo raro de cada escena de misterio
  ok(quienes(correrEscena(ESCENAS_ACTO1['algo-cruza'])).join() === 'duende:pillo-cruza,raro:algo-cruzo', 'algo-cruza: el pillo cruza y se anota');
}

// ---------------------------------------------------------------- tarjetas y charla (funciones de consulta)
{
  ok(cierreDe(2, { bolsa: 'a' }).length === 2 && /rió bajito/.test(cierreDe(2, { bolsa: 'a' })[1]), 'cierre del 2 con la bolsa A');
  ok(/pan en todas las cuadras/.test(cierreDe(2, { bolsa: 'b' })[1]) && /gallinero/.test(cierreDe(2, { bolsa: 'b' })[1]), 'cierre del 2 con la bolsa B');
  ok(!/gallinero/.test(cierreDe(2, { bolsa: 'b' }, { sinGallinero: true })[1]), 'cierre del 2 con la bolsa B sin gallinero');
  ok(/Josefina pasó dos veces/.test(cierreDe(2, { bolsa: 'c' })[1]), 'cierre del 2 con la bolsa C');
  ok(cierreDe(2, {}).length === 1 && cierreDe(2, { bolsa: null }).length === 1, 'cierre del 2 sin decisión: sólo la base');
  ok(cierreDe(1).length === 3 && cierreDe(3).length === 2 && cierreDe(4).length === 3 && cierreDe(9).length === 0, 'cierres de los capítulos 1, 3 y 4, y capítulo inexistente');
  ok(/panes de Rosa/.test(premioDe(2, { bolsa: 'b' })) && !/Rosa/.test(premioDe(2, { bolsa: 'a' })), 'el premio del 2 suma los panes sólo con la bolsa B');
  ok(/pase de cabina/.test(premioDe(4)), 'el premio del 4 nombra el pase de cabina');
  ok(charlaDe('ramon', 2, {})?.id === 'ramon-c2-hacha' || charlaDe('ramon', 2, {})?.cap === 2, 'charla de Ramón en el capítulo 2');
  ok(charlaDe('ramon', 2, { decisiones: { bolsa: 'a' } })?.id === 'ramon-c2-coihue', 'la charla de Ramón con la bolsa A es la del coihue');
  ok(charlaDe('ramon', 4, {})?.id === 'ramon-c4-ingeniera', 'en el capítulo 4 gana la línea del capítulo 4');
  ok(charlaDe('rosa', 2, { optativas: ['frasco-masa-madre'] })?.id === 'rosa-c2-frasco', 'Rosa habla del frasco si llevaste la optativa');
  ok(charlaDe('herminia', 2, {}) === null && charlaDe('herminia', 3, { escenas: ['placa-herminia'] })?.id === 'herminia-c3-chicos', 'Herminia sólo cuenta lo de los chicos después de la placa');
  ok(charlaDe('nadie', 2, {}) === null && charlaDe('ramon', 1, {}) === null, 'sin charla para quien no está o antes de tiempo');
  ok(Object.hasOwn(TEXTO_ACTO1.charla, 'constructor') === false, 'sin claves peligrosas en la charla');
}

// ---------------------------------------------------------------- los pedidos para el agente A están anotados, y el módulo es seguro para el empaquetador
{
  const cambios = existsSync(join(raiz, 'CAMBIOS_4_15_0_B.md')) ? leer('CAMBIOS_4_15_0_B.md') : '';
  ok(cambios.length > 500, 'existe CAMBIOS_4_15_0_B.md');
  const cambiosA = existsSync(join(raiz, 'CAMBIOS_4_16_0_A.md')) ? leer('CAMBIOS_4_16_0_A.md') : '';   // (4.16.0: las condiciones y efectos que sumó el acto II se documentan ahí)
  for (const k of CLAVES_PEDIDAS) ok(new RegExp(k, 'i').test(cambios), `los pedidos para A nombran a «${k}»`);
  for (const nombre of EFECTOS_ACTO1.map((x) => x.split(':')[0]).filter((x, i, a) => a.indexOf(x) === i)) ok(cambios.includes(`${nombre}:`), `CAMBIOS_4_15_0_B.md documenta la convención «${nombre}:»`);
  for (const cond of CONDICIONES_HISTORIA) ok(cambios.includes(cond) || cambiosA.includes(`«${cond}»`), `CAMBIOS_4_15_0_B.md documenta la condición «${cond}»`);
  ok(!/scratch/i.test(cambios), 'los cambios no mencionan lo que no se menciona');
  for (const a of ['src/historia-escenas-acto1.js', 'src/historia-texto-acto1.js', 'src/historia-escenas-util.js']) {
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
  ok(Object.keys(POSE_DE).length >= 15 && Object.values(POSE_DE).every((p) => POSES_ESCENA.includes(p)), 'la tabla de gestos del guion sólo apunta a poses que existen');
  ok(Object.values(PERSONAJES_HISTORIA).every((p) => typeof p.nombre === 'string' && Object.hasOwn(p, 'clave')), 'los personajes de la historia están completos');
  ok(MAX_OPCIONES >= 3, 'el motor admite 3 opciones');
}

// ---------------------------------------------------------------- MUTACIONES: se rompe una garantía de los datos y la suite tiene que fallar
const clon = (o) => JSON.parse(JSON.stringify(o));
function mutante(tocar) {
  const e = clon(ESCENAS_ACTO1), t = clon(TEXTO_ACTO1), fu = { claves: new Set(CLAVES), lugares: new Set(LUGARES), disparo: clon(DISPARO_ACTO1), textoJuego: fuentes.textoJuego };
  tocar(e, t, fu);
  return suite(e, t, fu);
}
const primeroDialogo = (e) => e.pasos.find((p) => p.tipo === 'dialogo');
const MUTACIONES = [
  ['falta una escena', (e) => { delete e['te-graciela']; }],
  ['una escena de más', (e) => { e['extra-uno'] = { ...clon(e['te-graciela']), id: 'extra-uno' }; }],
  ['el id no coincide con la clave', (e) => { e['cabina-elsa'].id = 'cabina'; }],
  ['un plano desconocido', (e) => { e['nota-eusebio'].pasos[1].plano = 'cenital'; }],
  ['un paso sin tipo', (e) => { e['ronda-umbral'].pasos.push({ tipo: 'volar' }); }],
  ['una opción sin efecto ni sabor', (e) => { delete e['ramon-tranquera'].pasos.find((p) => p.tipo === 'eleccion').opciones[0].sabor; }],
  ['una opción con efecto y sabor', (e) => { e['anden-graciela'].pasos.find((p) => p.tipo === 'eleccion').opciones[1].sabor = true; }],
  ['cuatro opciones', (e) => { const p = e['bolsa-alero'].pasos.find((q) => q.tipo === 'eleccion'); p.opciones.push({ id: 'd', texto: 'Tirarla al lago.', sabor: true }); }],
  ['una línea larguísima', (e) => { primeroDialogo(e['almacen-ercilia']).lineas[0] = 'Hola. ' + 'muy largo '.repeat(40); }],
  ['una opción larguísima', (e) => { e['placa-herminia'].pasos.find((p) => p.tipo === 'eleccion').opciones[0].texto = 'Yo creo en lo que veo y en lo que no veo '.repeat(4); }],
  ['inglés en una línea', (e) => { primeroDialogo(e['fermin-galpon']).lineas.push('Una frase con the adentro'); }],
  ['una palabra religiosa', (e) => { primeroDialogo(e['mesa-visita-ramon']).lineas.push('Que Dios lo bendiga, m\'hijo.'); }],
  ['una palabra explícita', (e) => { primeroDialogo(e['te-graciela']).lineas.push('Qué sexo tan raro.'); }],
  ['una cosa que no existe en el juego', (e) => { primeroDialogo(e['derrumbe-puertita']).lineas.push('Graciela se fue al hospedaje.'); }],
  ['una persona que no existe', (e) => { primeroDialogo(e['almacen-ercilia']).lineas.push('Esto me lo dijo la tía Hortensia.'); }],
  ['un hablante sin declarar', (e) => { primeroDialogo(e['ramon-tranquera']).quien = 'ramoncito'; }],
  ['una clave de personaje que no existe', (e) => { e['mesa-visita-nicanor'].personajes.nicanor.clave = 'nicanor2'; }],
  ['un lugar que no existe', (e) => { e['estacion-llegada'].pasos[0].a = { lugar: 'aeropuerto' }; }],
  ['un efecto fuera de la convención', (e) => { e['bolsa-rosa'].pasos.push({ tipo: 'efecto', nombre: 'regalo:muchos' }); }],
  ['un lazo exagerado', (e) => { e['bolsa-rosa'].pasos.push({ tipo: 'efecto', nombre: 'lazo:ercilia:9' }); }],
  ['una condición que no está en la convención', (e) => { e['placa-herminia'].pasos.push({ tipo: 'dialogo', quien: 'herminia', lineas: ['Hola.'], si: { cond: 'magia', args: {} } }); }],
  ['un raro sin texto', (e) => { e['hacha-tocon'].pasos.push({ tipo: 'efecto', nombre: 'raro:hacha-fantasma' }); }],
  ['un objeto sin texto', (e) => { e['nota-eusebio'].pasos.push({ tipo: 'efecto', nombre: 'objeto:llave-del-79' }); }],
  ['una escena efímera', (e) => { e['algo-cruza'].efimera = true; }],
  ['una escena sin resumen', (e) => { delete e['fermin-galpon'].resumen; }],
  ['una escena sin planos', (e) => { e['te-graciela'].pasos = e['te-graciela'].pasos.filter((p) => p.tipo !== 'plano' && !(p.tipo === 'dialogo')); }],
  ['algo-cruza con texto', (e) => { e['algo-cruza'].pasos.push({ tipo: 'dialogo', quien: 'narra', lineas: ['Algo cruzó.'] }); }],
  ['una pose que no existe', (e) => { e['cabina-elsa'].pasos.push({ tipo: 'gesto', quien: 'elsa', accion: 'posar', pose: 'volar' }); }],
  ['falta la tabla de disparo de una escena', (e, t, fu) => { delete fu.disparo['hacha-tocon']; }],
  ['el cierre del capítulo 2 sin una variante', (e, t) => { delete t.capitulos[2].cierre.segun.b; }],
  ['un capítulo sin premio', (e, t) => { delete t.capitulos[3].premio.texto; }],
  ['una entrada de lo raro incompleta', (e, t) => { delete t.raro['luces-lago'].texto; }],
  ['inglés en una tarjeta', (e, t) => { t.capitulos[1].entrada.push('The valley is waiting for you'); }],
  ['religión en una nota', (e, t) => { t.notas['nota-eusebio'].texto.push('Rezá antes de abrir.'); }],
  ['un párrafo de tarjeta enorme', (e, t) => { t.capitulos[4].cierre.base.push('Muy largo. '.repeat(60)); }],
  ['un vecino sin charla', (e, t) => { t.charla.rosa = []; }],
  ['la decisión de la bolsa sin una opción', (e) => { const p = e['bolsa-alero'].pasos.find((q) => q.tipo === 'eleccion'); p.opciones[2].efecto = 'decision:bolsa:a'; }],
  ['una elección que salta a una etiqueta inexistente', (e) => { e['derrumbe-puertita'].pasos.find((p) => p.tipo === 'eleccion').opciones[0].a = 'nunca'; }],
];
let atrapadas = 0;
for (const [nombre, tocar] of MUTACIONES) {
  const fs_ = mutante(tocar);
  if (fs_.length) atrapadas++; else console.log('NO ATRAPÓ la mutación: ' + nombre);
  ok(fs_.length > 0, `la prueba atrapa la mutación «${nombre}»`);
}
ok(atrapadas === MUTACIONES.length && MUTACIONES.length >= 35, `atrapó ${atrapadas} de ${MUTACIONES.length} mutaciones`);
// la suite sobre los datos reales no se rompe por sí sola: una copia exacta pasa
ok(mutante(() => {}).length === 0, 'una copia exacta de los datos pasa la suite');

console.log(fallas ? `FALLARON ${fallas} de ${n}` : `verificar-4-15-0-escenas-acto1: ${n} comprobaciones OK (${totalCaminos} caminos, ${MUTACIONES.length} mutaciones atrapadas)`);
process.exit(fallas ? 1 : 0);
