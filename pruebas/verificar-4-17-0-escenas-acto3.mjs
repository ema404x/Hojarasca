// 4.17.0 (B): las escenas y los textos del ACTO III de la Historia (src/historia-escenas-acto3.js, -c9 … -c13, historia-texto-acto3.js). Sólo Node.
// Las escenas son datos: la prueba las valida con el director real (escenas.js), las corre de punta a punta por TODOS los caminos de elección
// (y por las combinaciones de decisiones, lazos, trato, noche, ramal… que cada una mira) con un mundo de mentira, las salta, y revisa los textos
// (cabe en el cuadro, sin inglés, sin palabras religiosas ni explícitas, sin nombrar nada que no exista en el juego; la pareja, sólo sugerida).
// Al final hay MUTACIONES de los datos (se rompe una garantía a propósito) y la prueba tiene que atraparlas todas.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { ESCENAS_ACTO3, IDS_ACTO3, EFECTOS_ACTO3, DISPARO_ACTO3, POR_DEFECTO_ACTO3 } from '../src/historia-escenas-acto3.js';
import { ESCENAS_ACTO1 } from '../src/historia-escenas-acto1.js';
import { ESCENAS_ACTO2 } from '../src/historia-escenas-acto2.js';
import { TEXTO_ACTO1 } from '../src/historia-texto-acto1.js';
import { TEXTO_ACTO2 } from '../src/historia-texto-acto2.js';
import { TEXTO_ACTO3, entradaDe3, cierreDe3, premioDe3, paginaTratosDe3, finalDe3, charlaDe3 } from '../src/historia-texto-acto3.js';
import { efectosDe, condicionesDe, POSE_DE } from '../src/historia-escenas-util.js';
import { PERSONAJES_ACTO3, pj3, parsearEfectoActo3, CONDICIONES_ACTO3, TIPOS_EFECTO_ACTO3, VALORES_CONDICION, CONDICIONES_BOOLEANAS } from '../src/historia-escenas-acto3-util.js';
import { crearDirector, validarEscena, PERSONAJES_BASE, POSES_ESCENA, MAX_OPCIONES } from '../src/escenas.js';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => readFileSync(join(raiz, f), 'utf8');
let n = 0, fallas = 0;
const ok = (c, t) => { n++; if (!c) { fallas++; console.log('FALLA ' + t); } };

const IDS_PEDIDOS = [
  'ramon-cama', 'fermin-tranquera', 'majada-fermin', 'majada-vos', 'majada-belisario', 'hojas-canelo', 'papel-elsa', 'visita-ramon',
  'galpon-golpe', 'galpon-sin-golpear', 'galpon-encuentro', 'galpon-trato', 'galpon-pelea', 'cerro-mirador', 'mesa-guerra', 'llave-79', 'pedir-perdon',
  'tito-arco', 'plumas-bosque', 'plumas-gallinero', 'plumas-josefina', 'blancos-paso', 'fermin-paces', 'fermin-honda', 'blancos-esquila',
  'elvira-cuerda', 'anselmo-puntas', 'prestado-herrero', 'prestado-apicultor', 'prestado-maquinista', 'prestado-guarda', 'prestado-tobias', 'deuda-pagada',
  'recorrer-lado', 'flechas-de-mas', 'cumple-nevada', 'pareja-noche-antes',
  'cena-caliente', 'herminia-estacion', 'noche-espera', 'noche-entre-1', 'noche-entre-2', 'noche-tras-ganar', 'noche-tras-perder',
  'amanecer-trato-ganada', 'amanecer-trato-perdida', 'amanecer-pelea-ganada', 'amanecer-pelea-perdida',
  'carpeta-celeste', 'majada-fin', 'volver-a-subir', 'josefina-fin', 'fiesta-nieve', 'umbral-fin', 'costumbre-dejar', 'costumbre-regalito',
];
// lo que el guion usa y todavía no existe en el juego (va como pedido para el agente A en CAMBIOS_4_17_0_B.md): se tolera, pero tiene que estar anotado
const CLAVES_PEDIDAS = ['graciela', 'pareja'];
const NOMBRES_OK = new Set(['Administración', 'Aires', 'Aldea', 'Arroyo', 'Aurelio', 'Belisario', 'Buenos', 'Don', 'Duendes', 'Elsa', 'Ercilia', 'Esquel', 'Estación', 'Eusebio', 'Fermín', 'Graciela', 'Herminia', 'Josefina', 'Nicanor', 'Nélida', 'Pugh', 'Ramal', 'Ramón', 'Refugio', 'Rosa', 'Trevelin', 'Valle', 'Bariloche', 'Gales', 'Ernesto',
  'Tito', 'Tobías', 'Sofía', 'Nahuel', 'Lucía', 'Aníbal', 'Salazar', 'Prieto', 'Diolch', 'Julia', 'Millán', 'Molino', 'Cuentas', 'Paso', 'Puesto', 'Alto', 'Llancafil', 'Fiesta', 'Cosecha',
  // el acto III suma
  'Marta', 'Martín', 'Anselmo', 'Guido', 'Elvira', 'Chocolate', 'Mandamás', 'Cerro', 'Negro', 'Nieve', 'Jones', 'Catrileo', 'Chile', 'Parques', 'Varios', 'Cooperativa', 'Árbol', 'Notable', 'Solicito', 'Firmado', 'Salvo', 'Hojarasca', 'Anexo', 'Hallado', 'Lenga', 'Lago', 'Junio', 'Acá', 'Año', 'Feliz', 'Esperá', 'Yo', 'Todo', 'Cauquén', 'Alto', 'Ramón']);
const PERSONAS_REALES = ['Aurelio', 'Belisario', 'Herminia', 'Rosa', 'Fermín', 'Nélida', 'Ernesto', 'Nicanor', 'Ramón', 'Josefina', 'Ercilia', 'Elsa', 'Tito', 'Tobías', 'Nahuel', 'Lucía', 'Marta', 'Martín', 'Anselmo', 'Guido', 'Elvira'];
const MAX_LINEA = 260;      // letras por línea de diálogo: cabe en cuatro renglones del cuadro (840 px, 21 px)
const MAX_OPCION = 96;      // una opción de elección (un botón)
const MAX_PREGUNTA = 72;
const MAX_PARRAFO = 420;    // un párrafo de tarjeta
const TIPOS_DUENDE = ['rastreador', 'volador', 'enjambre', 'excavador', 'jefe', 'saltador', 'tirador', 'bruto', 'curandero'];
const CAPS = [9, 10, 11, 12, 13];

// palabras enteras con letras de verdad (el \b de JavaScript no sabe de acentos: «cruzó» no es «cruz»)
const pal = (lista) => new RegExp(String.raw`(?<![\p{L}\p{N}])(?:${lista})(?![\p{L}\p{N}])`, 'iu');
const INGLES = pal("the|and|you|your|with|this|that|have|from|they|will|would|there|here|what|when|where|which|are|was|were|not|but|for|into|our|his|her|she|him|its|okay|hello|sorry|please|thanks|yes|don't|can't|it's");
const SAGRADO = pal("dios|diablo|santo|santa|santos|virgen|ángel|ángeles|angeles|cruz|rez\\p{L}*|oración|infierno|demonio\\p{L}*|iglesia|capilla|misa|altar|bautiz\\p{L}*|cristo|jesús|plegaria|bendito|pachamama|gauchito|difunta correa|nguillatún|kalku|machi|bendec\\p{L}*|bendic\\p{L}*|sagrad\\p{L}*|ofrenda\\p{L}*|milagro\\p{L}*|cielo santo|pecado\\p{L}*|tumba|funeral\\p{L}*|rito|ritual\\p{L}*");
const EXPLICITO = pal("sexo|sexual\\p{L}*|desnud\\p{L}*|tetas?|pene|verga|coger|cogiendo|culo|orgasm\\p{L}*|erótic\\p{L}*|follar|concha|puta\\p{L}*|mierda|carajo|boludo\\p{L}*|pija");
// lo sensual SOLO sugerido: ni siquiera cosas más suaves en la escena de la pareja
const MUY_EXPLICITO = pal("cama|camas|bes[oa]\\p{L}*|sábanas|piel|gemid\\p{L}*|acarici\\p{L}*|labios|pecho|muslos?|cuerpo|abraz\\p{L}*|amantes?|desvest\\p{L}*");
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
  else if (obj && typeof obj === 'object') for (const [k, v] of Object.entries(obj)) { if (['id', 'tecla', 'd', 'es', 'decision', 'optativa', 'escena', 'estacion', 'desbloqueo', 'donde', 'trato', 'noche'].includes(k) && typeof v === 'string') continue; textosPlanos(v, acc); }
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
// lo que una escena mira (para correrla con todas las variantes): decisiones, lazos, trato, noche, ramal, deuda y las condiciones booleanas
function condicionesMiradas(e) {
  const decs = new Set(), lazos = new Set(), otras = new Set();
  const rec = (v) => {
    if (Array.isArray(v)) v.forEach(rec);
    else if (v && typeof v === 'object') {
      if (typeof v.cond === 'string') {
        if (v.cond === 'decision' && v.args) decs.add(v.args.d);
        else if (v.cond === 'lazo' && v.args) lazos.add(v.args.quien);
        else otras.add(v.cond);
      }
      for (const x of Object.values(v)) rec(x);
    }
  };
  rec(e.pasos);
  rec(e.disparador);
  return { decs: [...decs], lazos: [...lazos], otras: [...otras].filter((c) => c !== 'evento' && c !== 'presente') };
}
const BASE = { decisiones: {}, lazos: {}, st: { trato: 'trato', noche: 'ganada', ramal: 'prueba', deuda: false, convidado: false, 'devolver-bolsa': false, perdon: false, amor: false, perro: false } };
function variantesDe(e) {
  const { decs, lazos, otras } = condicionesMiradas(e);
  const factores = [];
  for (const d of decs) factores.push({ tipo: 'dec', clave: d, valores: ['a', 'b', 'c'] });
  for (const q of lazos) factores.push({ tipo: 'lazo', clave: q, valores: [3, 1, -2] });
  for (const c of otras) {
    if (c === 'deuda') factores.push({ tipo: 'st', clave: 'deuda', valores: [true, false] });
    else if (Object.hasOwn(VALORES_CONDICION, c)) factores.push({ tipo: 'st', clave: c === 'ramal-nivel' ? 'ramal' : c, valores: VALORES_CONDICION[c] });
    else if (CONDICIONES_BOOLEANAS.includes(c)) factores.push({ tipo: 'st', clave: c, valores: [true, false] });
  }
  const aplicar = (v, f, val) => {
    if (f.tipo === 'dec') v.decisiones[f.clave] = val;
    else if (f.tipo === 'lazo') v.lazos[f.clave] = val;
    else v.st[f.clave] = val;
  };
  const copia = () => ({ decisiones: { ...BASE.decisiones }, lazos: { ...BASE.lazos }, st: { ...BASE.st } });
  const total = factores.reduce((s, f) => s * f.valores.length, 1);
  const r = [];
  if (total <= 96) {
    let acc = [copia()];
    for (const f of factores) acc = acc.flatMap((v) => f.valores.map((val) => { const c = { decisiones: { ...v.decisiones }, lazos: { ...v.lazos }, st: { ...v.st } }; aplicar(c, f, val); return c; }));
    return acc;
  }
  // demasiadas: cada factor por separado (con el resto en su base) y unas cuantas combinaciones al azar (semilla fija)
  r.push(copia());
  for (const f of factores) for (const val of f.valores) { const c = copia(); aplicar(c, f, val); r.push(c); }
  let semilla = 12345;
  const azar = () => { semilla = (semilla * 1103515245 + 12345) & 0x7fffffff; return semilla / 0x7fffffff; };
  for (let i = 0; i < 40; i++) { const c = copia(); for (const f of factores) aplicar(c, f, f.valores[Math.floor(azar() * f.valores.length)]); r.push(c); }
  return r;
}

// ---------------------------------------------------------------- un mundo de mentira
function mundoFalso() {
  const claves = ['guarda', 'ramon', 'ema', 'ercilia', 'nicanor', 'nelida', 'jefe', 'abuela', 'panadera', 'fermin', 'graciela', 'carpintero', 'tobias', 'belisario', 'nene', 'nena', 'fotografa', 'enfermera', 'martin', 'herrero', 'apicultor', 'tejedora', 'pareja'];
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
// `decisiones`: la historia (D1…D5). `lazos`: { quien: n }. `st`: trato, noche, ramal, deuda y las condiciones booleanas. Devuelve { lineas, corridos… }
function correrEscena(escena, { script = [], decisiones = {}, lazos = {}, st = {}, eventos = [], saltarAl = -1, efectosExtra = [] } = {}) {
  const mundo = mundoFalso();
  const est = { vistas: {}, elecciones: {} };
  const corridos = [];
  const dec = { ...decisiones };
  const estado = { ...BASE.st, ...st };
  const resultados = [];
  const efectos = {};
  for (const nombre of [...EFECTOS_ACTO3, ...efectosExtra]) {
    efectos[nombre] = (args, ctx) => {
      corridos.push({ nombre, args, saltando: ctx.saltando });
      const p = parsearEfectoActo3(nombre);
      if (p && p.tipo === 'decision') dec[p.d] = p.v;
      if (p && p.tipo === 'duendes') { if (p.id === 'trato' || p.id === 'trato-fuerte') estado.trato = p.id === 'trato' ? 'trato' : 'fuerte'; if (p.id === 'pelea') estado.trato = 'pelea'; }
    };
  }
  const condiciones = {
    decision: (c) => (dec[c.args.d] ?? 'ninguna') === c.args.es,
    lazo: (c) => { const v = lazos[c.args.quien] ?? 0; return (c.args.min === undefined || v >= c.args.min) && (c.args.max === undefined || v <= c.args.max); },
    evento: (c) => eventos.includes(c.args.id),
    trato: (c) => (c.args.es === 'trato' ? estado.trato === 'trato' || estado.trato === 'fuerte' : estado.trato === c.args.es),
    noche: (c) => estado.noche === c.args.es,
    'ramal-nivel': (c) => estado.ramal === c.args.es,
    deuda: (c) => (c.args.es === 'pendiente') === !!estado.deuda,
  };
  for (const b of CONDICIONES_BOOLEANAS) condiciones[b] = () => !!estado[b];
  const dir = crearDirector({ mundo, estado: () => est, dia: () => 5, efectos, condiciones, alTerminar: (r) => resultados.push(r) });
  const reg = dir.registrar(escena);
  const log = { reg, lineas: [], hablantes: [], elecciones: [], pasos: 0, activa: false, camaras: 0 };
  if (!reg.ok) return { ...log, mundo, corridos, resultados, dir, est, dec, estado, falloRegistro: true };
  log.faltan = dir.efectosFaltantes(escena.id);
  if (!dir.disparar(escena.id)) { log.noDisparo = true; return { ...log, mundo, corridos, resultados, dir, est, dec, estado }; }
  let ultima = '', i = 0, k = 0;
  while (dir.activa() && i++ < 60000) {
    mundo.simular(0.05);
    dir.actualizar(0.05);
    if (saltarAl >= 0 && i === saltarAl) { dir.saltar(); continue; }
    const d = dir.datos(), cam = dir.camara();
    if (cam) log.camaras++;
    if (d?.eleccion) {
      const idx = k < script.length ? script[k] : 0;
      log.elecciones.push({ id: d.eleccion.id, n: d.eleccion.opciones.length, tomada: idx, texto: d.eleccion.opciones[idx]?.texto, opcion: d.eleccion.opciones[idx]?.id });
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
  return { ...log, mundo, corridos, resultados, dir, est, dec, estado };
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
  const objetosConocidos = { ...TEXTO_ACTO1.objetos, ...TEXTO_ACTO2.objetos, ...(TEX.objetos || {}) };

  // 1) los ids exactos
  c(IDS_PEDIDOS.every((id) => ids.includes(id)), 'faltan escenas: ' + IDS_PEDIDOS.filter((id) => !ids.includes(id)).join(', '));
  c(ids.length === IDS_PEDIDOS.length, 'hay escenas de más o de menos (' + ids.length + ')');
  c(Object.entries(ESC).every(([k, e]) => e && e.id === k), 'el id de cada escena coincide con su clave');
  c(ids.every((id) => !Object.hasOwn(ESCENAS_ACTO1, id) && !Object.hasOwn(ESCENAS_ACTO2, id)), 'un id de escena choca con el acto I o II');

  // 2) válidas con el validador del motor
  for (const e of escenas) {
    const v = validarEscena(e);
    c(v.ok, `${e?.id}: no valida (${(v.errores || []).join('; ')})`);
    c(typeof e.resumen === 'string' && e.resumen.length > 20, `${e?.id}: sin resumen para cuando se salta`);
    c(typeof e.titulo === 'string' && e.titulo.length > 2, `${e?.id}: sin título`);
    c(e.acto === 3 && e.capitulo >= 9 && e.capitulo <= 13, `${e?.id}: acto o capítulo fuera del acto III`);
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
    for (const nombre of efectosDe(e)) c(parsearEfectoActo3(nombre), `${e.id}: el efecto «${nombre}» no sigue la convención`);
    for (const cond of condicionesDe(e)) c(CONDICIONES_ACTO3.includes(cond), `${e.id}: la condición «${cond}» no está en la convención`);
    if (e.disparador && typeof e.disparador.cond === 'string') c(CONDICIONES_ACTO3.includes(e.disparador.cond), `${e.id}: el disparador usa una condición que no está en la convención`);
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
  c([...usados].every((x) => EFECTOS_ACTO3.includes(x)), 'EFECTOS_ACTO3 no cubre los efectos usados');

  // 5) las elecciones: cada opción tiene efecto, o es de sabor declarado; ids únicos entre todas las escenas
  let totalElecciones = 0, conEfecto = 0;
  const idsEleccion = new Set([...Object.values(ESCENAS_ACTO1), ...Object.values(ESCENAS_ACTO2)].flatMap((e) => e.pasos.filter((p) => p.tipo === 'eleccion').map((p) => p.id)));
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
  c(totalElecciones >= 45, 'pocas elecciones en todo el acto (' + totalElecciones + ')');
  c(conEfecto >= 20, 'pocas elecciones con efecto (' + conEfecto + ')');

  // 6) los hablantes están declarados y existen en el juego; los duendes no hablan
  for (const e of escenas) {
    const decl = { ...PERSONAJES_BASE, ...(e.personajes || {}) };
    for (const q of hablantesUsados(e)) {
      c(q && Object.hasOwn(decl, q), `${e.id}: hablante o actor sin declarar «${q}»`);
      c(!/duende|mandam|pillo|jefe/i.test(String(q)) || q === 'jefe', `${e.id}: un duende habla («${q}»): los duendes se ven y se oyen, no hablan`);
    }
    for (const [k, pjx] of Object.entries(e.personajes || {})) {
      if (pjx.clave) c(fuentes.claves.has(pjx.clave) || CLAVES_PEDIDAS.includes(pjx.clave), `${e.id}: «${k}» usa la clave «${pjx.clave}» que no existe en el juego`);
      c(typeof pjx.nombre === 'string' && /^#[0-9a-f]{6}$/i.test(pjx.color || ''), `${e.id}: personaje «${k}» sin nombre o color`);
    }
    const posar = (p) => { if (p.tipo === 'gesto' && p.accion === 'posar') c(POSES_ESCENA.includes(p.pose), `${e.id}: pose «${p.pose}» que el motor no sabe`); if (p.tipo === 'fundido') (p.alMedio || []).forEach(posar); };
    e.pasos.forEach(posar);
    for (const l of e.pasos.filter((p) => p.tipo === 'dialogo').flatMap((p) => p.lineas)) if (l && l.gesto) c(POSES_ESCENA.includes(l.gesto.pose), `${e.id}: pose de línea «${l.gesto.pose}» que el motor no sabe`);
    // lugares con nombre: tienen que existir en T.lugares
    for (const l of lugaresUsados(e)) c(fuentes.lugares.has(l), `${e.id}: el lugar «${l}» no existe en T.lugares`);
    // «tu pareja» sólo aparece con el amor prendido (condición `amor` en el paso, o en el disparador de la escena)
    const conAmor = e.disparador && e.disparador.cond === 'amor';
    const vistaPareja = (p) => {
      const nombra = (p.tipo === 'dialogo' && p.quien === 'pareja') || (p.tipo === 'gesto' && p.quien === 'pareja') || (p.tipo === 'plano' && p.a === 'pareja');
      if (nombra) c(conAmor || (p.si && p.si.cond === 'amor'), `${e.id}: «tu pareja» sale sin la condición del amor prendido`);
      if (p.tipo === 'fundido') (p.alMedio || []).forEach(vistaPareja);
    };
    e.pasos.forEach(vistaPareja);
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
      if (e.id === 'pareja-noche-antes' || e.id === 'fiesta-nieve') c(!MUY_EXPLICITO.test(t), `${e.id}: demasiado explícito para lo sugerido en «${t.slice(0, 50)}»`);
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

  // 8) las tarjetas del acto III
  for (const num of CAPS) {
    const cap = TEX.capitulos?.[num];
    c(!!cap, `falta el capítulo ${num}`);
    if (!cap) continue;
    c(cap.entrada?.length >= 2 && cap.entrada.every((p) => p.length > 30), `capítulo ${num}: entrada incompleta`);
    c(cap.cierre?.base?.length >= 1, `capítulo ${num}: sin cierre`);
    c(cap.objetivos?.length >= 4 && cap.objetivos.every((o) => o.id && o.texto && o.tecla), `capítulo ${num}: objetivos incompletos`);
    c(Array.isArray(cap.optativas) && cap.optativas.every((o) => o.id && o.texto), `capítulo ${num}: optativas incompletas`);
    c(cap.premio?.texto && cap.premio.texto.length > 10, `capítulo ${num}: sin premio en texto`);
    c(cap.acto === 3, `capítulo ${num}: acto mal`);
  }
  const ok3 = (v, claves) => !!v && claves.every((k) => typeof v[k] === 'string' && v[k].length > 20);
  c(TEX.capitulos?.[9]?.puerta?.temprano?.length >= 1 && TEX.capitulos?.[9]?.puerta?.tarde?.length >= 1, 'capítulo 9: falta la puerta de estación (temprano / tarde)');
  c(TEX.capitulos?.[9]?.cierre?.segun?.d === 'majada' && ok3(TEX.capitulos[9].cierre.segun, ['a', 'b', 'c']), 'el cierre del 9 varía por la majada (a, b, c)');
  c(ok3(TEX.capitulos?.[9]?.premio?.segun, ['a', 'b', 'c']) && TEX.capitulos[9].premio.segun.d === 'majada', 'el premio del 9 varía por la majada');
  c(ok3(TEX.capitulos?.[10]?.cierre?.segunTrato, ['trato', 'pelea']), 'el cierre del 10 tiene las dos variantes (trato, pelea)');
  c(ok3(TEX.capitulos?.[10]?.premio?.segunTrato, ['trato', 'pelea']) && ok3(TEX.capitulos?.[12]?.premio?.segunTrato, ['trato', 'pelea']) && ok3(TEX.capitulos?.[13]?.premio?.segunTrato, ['trato', 'pelea']), 'los premios del 10, el 12 y el 13 varían por el trato');
  c(ok3(TEX.capitulos?.[11]?.cierre?.segunTrato, ['trato', 'pelea']) && ok3(TEX.capitulos?.[12]?.entrada && TEX.capitulos[12].segunTrato, ['trato', 'pelea']) && ok3(TEX.capitulos?.[13]?.segunTrato, ['trato', 'pelea']), 'las tarjetas del 11, el 12 y el 13 cambian con el trato');
  c(ok3(TEX.capitulos?.[12]?.cierre?.segunNoche, ['ganada', 'perdida']), 'el cierre del 12 cambia con la noche (ganada, perdida)');
  c(['a', 'b', 'c'].every((v) => typeof TEX.capitulos?.[9]?.entradaSegun?.[v] === 'string') && ['a', 'b', 'c'].every((v) => typeof TEX.capitulos?.[10]?.entradaSegun?.[v] === 'string') && ['a', 'b', 'c'].every((v) => typeof TEX.capitulos?.[11]?.entradaSegun?.[v] === 'string'), 'las entradas del 9, el 10 y el 11 tienen una frase por decisión');
  const raros = TEX.raro || {};
  for (const [id, r] of Object.entries(raros)) {
    c(parsearEfectoActo3(`raro:${id}`), `raro «${id}»: id fuera de la convención`);
    c(typeof r.texto === 'string' && r.texto.length > 15 && typeof r.titulo === 'string' && r.cap >= 9 && r.cap <= 13 && typeof r.donde === 'string', `raro «${id}»: entrada incompleta`);
  }
  // cada raro / objeto que una escena anota existe en los textos
  for (const nombre of usados) {
    const p = parsearEfectoActo3(nombre);
    if (!p) continue;
    if (p.tipo === 'raro') c(Object.hasOwn(raros, p.id), `raro «${p.id}» usado por una escena y sin texto`);
    if (p.tipo === 'objeto' || p.tipo === 'entrega') c(Object.hasOwn(objetosConocidos, p.id), `objeto «${p.id}» usado por una escena y sin texto`);
  }
  // cada entrada del cuaderno de lo raro la anota alguna escena (nada huérfano)
  for (const id of Object.keys(raros)) c(usados.has(`raro:${id}`), `raro «${id}»: ninguna escena lo anota`);
  // las notas
  for (const id of ['placa-plaza', 'papel-ramon', 'pedido-traslado', 'informe-cierre', 'anexo-graciela', 'ficha-cauquen', 'postal-fermin', 'cartel-catrileo', 'cartel-arbol', 'cuaderno-4', 'pagina-tratos-3']) c(Array.isArray(TEX.notas?.[id]?.texto) && TEX.notas[id].texto.length >= 1, `falta la nota «${id}»`);
  for (const id of ['llave-79', 'foto-de-tres', 'canto-gemelo', 'mate-de-chocolate', 'silbato-de-elsa', 'cuaderno-del-abuelo', 'arco', 'honda']) c(typeof TEX.objetos?.[id]?.texto === 'string', `falta el objeto «${id}»`);
  c(Array.isArray(TEX.creditos) && TEX.creditos.length >= 4, 'faltan los créditos de la historia');

  // las decisiones del acto III: D5 (la majada) y D6 (trato o pelea), con todas sus ramas
  {
    const p = ESC['fermin-tranquera']?.pasos.find((q) => q.tipo === 'eleccion' && q.id === 'majada');
    c(!!p && p.opciones.length === 3 && p.opciones.every((o) => o.efecto === `decision:majada:${o.id}`), 'fermin-tranquera: cada opción de la majada guarda su propia decisión');
    c(!!p && p.opciones[p.porDefecto]?.id === POR_DEFECTO_ACTO3.majada, 'fermin-tranquera: la opción por defecto no coincide con POR_DEFECTO_ACTO3.majada');
    c(['a', 'b', 'c'].every((v) => usados.has(`decision:majada:${v}`)), 'la decisión «majada» no tiene las tres opciones');
    const p3 = ESC['galpon-encuentro']?.pasos.find((q) => q.tipo === 'eleccion' && q.id === 'duendes');
    const p2 = ESC['galpon-encuentro']?.pasos.find((q) => q.tipo === 'eleccion' && q.id === 'duendes-sin');
    c(!!p3 && p3.opciones.length === 3 && ['duendes:trato', 'duendes:trato-fuerte', 'duendes:pelea'].every((x, i) => p3.opciones[i].efecto === x), 'galpon-encuentro: la elección con la bolsa tiene las tres salidas (trato, fuerte, pelea)');
    c(!!p2 && p2.opciones.length === 2 && p2.opciones[0].efecto === 'duendes:trato' && p2.opciones[1].efecto === 'duendes:pelea', 'galpon-encuentro: la elección sin la bolsa tiene dos salidas (trato, pelea)');
    c(!!p3 && !!p2 && p3.opciones[p3.porDefecto]?.id === POR_DEFECTO_ACTO3.duendes && p2.opciones[p2.porDefecto]?.id === POR_DEFECTO_ACTO3.duendes, 'galpon-encuentro: la opción por defecto no coincide con POR_DEFECTO_ACTO3.duendes');
    c(!!p3 && p3.si?.cond === 'devolver-bolsa' && !!p2 && p2.si?.cond === 'devolver-bolsa' && p2.si.no === true, 'galpon-encuentro: la opción de devolver la bolsa se ofrece sólo con la condición devolver-bolsa');
    const pn = ESC['noche-tras-perder']?.pasos.find((q) => q.tipo === 'eleccion' && q.id === 'perdida-resp');
    c(!!pn && pn.opciones.length === 2 && pn.opciones[0].efecto === 'noche:reintentar' && pn.opciones[1].efecto === 'noche:perdida' && pn.opciones[pn.porDefecto]?.id === POR_DEFECTO_ACTO3.noche, 'noche-tras-perder: «Otra vez» (reintentar, sin castigo) y «Que amanezca» (perdida); el defecto es reintentar');
  }
  // la charla de los vecinos
  const vecinos = ['ramon', 'nicanor', 'josefina', 'ercilia', 'fermin', 'herminia', 'rosa', 'elsa', 'graciela', 'tito', 'tobias', 'belisario', 'marta', 'anselmo', 'guido', 'elvira', 'martin'];
  for (const v of vecinos) {
    const l = TEX.charla?.[v];
    c(Array.isArray(l) && l.length >= 3, `charla: ${v} tiene menos de tres líneas`);
    for (const x of l || []) c(x.id && x.cap >= 9 && x.cap <= 13 && typeof x.texto === 'string' && x.texto.length > 20 && x.texto.length <= MAX_LINEA, `charla ${v}/${x.id}: línea inválida`);
  }
  const idsCharla = vecinos.flatMap((v) => (TEX.charla?.[v] || []).map((x) => x.id));
  c(new Set(idsCharla).size === idsCharla.length, 'charla: ids repetidos');
  c(idsCharla.length >= 70, 'charla: pocas líneas en total (' + idsCharla.length + ')');

  // 9) la tabla de disparo cubre todas las escenas, y su objetivo existe en el capítulo
  for (const id of ids) {
    const d = fuentes.disparo?.[id];
    c(!!d && d.cap >= 9 && d.cap <= 13 && typeof d.jugadorEn === 'string' && typeof d.cuando === 'string', `${id}: sin datos de disparo`);
    if (d && d.objetivo !== null && d.objetivo !== undefined) {
      const capTx = TEX.capitulos?.[d.cap];
      const oks = [...(capTx?.objetivos || []), ...(capTx?.optativas || [])].map((o) => o.id);
      c(oks.includes(d.objetivo), `${id}: el objetivo «${d.objetivo}» no existe en el capítulo ${d.cap}`);
    }
    if (d && ESC[id]) c(ESC[id].capitulo === d.cap, `${id}: el capítulo de la escena y el de la tabla de disparo no coinciden`);
  }
  return f;
}

const fuentes = { claves: CLAVES, lugares: LUGARES, disparo: DISPARO_ACTO3, textoJuego: FUENTES.aldea + FUENTES.gente + FUENTES.campo };
const reales = suite(ESCENAS_ACTO3, TEXTO_ACTO3, fuentes);
ok(reales.length === 0, 'la suite de datos pasa: ' + reales.slice(0, 12).join(' | ') + (reales.length > 12 ? ` (+${reales.length - 12})` : ''));
ok(IDS_ACTO3.length === 56, '56 escenas');
ok(Object.keys(PERSONAJES_ACTO3).every((k) => Object.hasOwn(pj3(k), k)), 'los personajes del acto III se arman con pj3()');
ok(TIPOS_EFECTO_ACTO3.every((t) => EFECTOS_ACTO3.some((x) => x.startsWith(t + ':'))), 'todos los tipos de efecto nuevos (duendes, noche, armas, perfil) se usan');

// ---------------------------------------------------------------- las escenas corren (todos los caminos, todas las variantes) y se saltan
let totalCaminos = 0, totalLineas = 0, totalCorridas = 0;
for (const [id, e] of Object.entries(ESCENAS_ACTO3)) {
  const variantes = variantesDe(e);
  ok(variantes.length >= 1, `${id}: tiene variantes para correr`);
  for (const v of variantes) {
    const camsRaiz = caminos(e, v);
    totalCaminos += camsRaiz.length;
    ok(camsRaiz.length >= 1, `${id}: se corre`);
    for (const { script, r } of camsRaiz) {
      totalCorridas++;
      const rot = `${id} [${script.join(',')}] ${JSON.stringify(v.decisiones)}${Object.keys(v.lazos).length ? JSON.stringify(v.lazos) : ''} ${JSON.stringify(v.st)}`;
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
ok(totalCaminos >= 400, 'se corrieron muchos caminos (' + totalCaminos + ')');
ok(totalLineas >= 1500, 'se dijeron muchas líneas en total (' + totalLineas + ')');

const quienes = (r) => r.corridos.map((x) => x.nombre);
const corrio = (id, o, ...nombres) => { const q = quienes(correrEscena(ESCENAS_ACTO3[id], o)); return nombres.every((x) => q.includes(x)); };
const noCorrio = (id, o, ...nombres) => { const q = quienes(correrEscena(ESCENAS_ACTO3[id], o)); return nombres.every((x) => !q.includes(x)); };
const dichas = (id, o) => correrEscena(ESCENAS_ACTO3[id], o).lineas;
const dice = (id, o, re) => dichas(id, o).some((l) => re.test(l));

// ---------------------------------------------------------------- D5: la majada de Ramón
{
  for (const [i, v] of [[0, 'a'], [1, 'b'], [2, 'c']]) {
    const r = correrEscena(ESCENAS_ACTO3['fermin-tranquera'], { script: [i] });
    ok(r.corridos.filter((x) => x.nombre.startsWith('decision:')).map((x) => x.nombre).join() === `decision:majada:${v}`, `fermin-tranquera opción ${i} guarda decision:majada:${v}`);
  }
  const rs = correrEscena(ESCENAS_ACTO3['fermin-tranquera'], { saltarAl: 3 });
  ok(rs.corridos.some((x) => x.nombre === 'decision:majada:a' && x.saltando === true), 'saltar fermin-tranquera deja que Fermín lleve la majada');
  ok(dice('fermin-tranquera', { script: [0] }, /no me la devuelvas flaca/) && !dice('fermin-tranquera', { script: [1] }, /no me la devuelvas flaca/) && dice('fermin-tranquera', { script: [2] }, /Hacé lo que tengas que hacer/), 'fermin-tranquera: cada opción tiene su reacción de Ramón');
  ok(corrio('majada-fermin', {}, 'decision:majada:a', 'lazo:fermin:3', 'lazo:ramon:-1', 'mundo:fermin-lana-amiga', 'mundo:fermin-oferta-rechazada') && noCorrio('majada-fermin', {}, 'lazo:ramon:-3'), 'majada-fermin: decisión A, Fermín +3, Ramón −1, lana a precio de amigo');
  ok(corrio('majada-vos', {}, 'decision:majada:b', 'lazo:ramon:2', 'lazo:fermin:-1', 'mundo:majada-vellones'), 'majada-vos: decisión B, Ramón +2, Fermín −1, vellones');
  ok(corrio('majada-belisario', {}, 'decision:majada:c', 'lazo:ramon:-3', 'lazo:fermin:-2', 'mundo:cobro-majada'), 'majada-belisario: decisión C, Ramón −3, Fermín −2, el cobro');
  ok(corrio('ramon-cama', { script: [0] }, 'lazo:ramon:1', 'mundo:ramon-convaleciente') && noCorrio('ramon-cama', { script: [1] }, 'lazo:ramon:1'), 'ramon-cama: primero la fiebre sube a Ramón');
  // las hojas de canelo (si convidaste) o la tranquera abierta (si no)
  const hc = quienes(correrEscena(ESCENAS_ACTO3['hojas-canelo'], { st: { convidado: true } }));
  const hn = quienes(correrEscena(ESCENAS_ACTO3['hojas-canelo'], { st: { convidado: false } }));
  ok(hc.includes('mundo:hojas-canelo') && hc.includes('duende:yuyero-de-espaldas') && hc.includes('raro:hojas-de-canelo') && !hc.includes('optativa:juntar-ovejas'), 'hojas-canelo con convidado: el atado de canelo y el yuyero que huye');
  ok(hn.includes('mundo:corral-abierto') && hn.includes('optativa:juntar-ovejas') && !hn.includes('mundo:hojas-canelo'), 'hojas-canelo sin convidar: la tranquera abierta y la optativa de juntar las ovejas');
  // el papel de Elsa: la tercera opción sólo con el ramal en 6 o más
  const pa = correrEscena(ESCENAS_ACTO3['papel-elsa'], { st: { ramal: 'prueba' } });
  const pb = correrEscena(ESCENAS_ACTO3['papel-elsa'], { st: { ramal: 'traslado' } });
  ok(pa.elecciones[0]?.id === 'papel-resp' && pa.elecciones[0].n === 3 && pb.elecciones[0]?.id === 'papel-bajo' && pb.elecciones[0].n === 2, 'papel-elsa: «la cuenta va bien» sólo se ofrece con el ramal en 6 o más');
  ok(corrio('papel-elsa', { st: { ramal: 'salvado' }, script: [1] }, 'lazo:guarda:2') && corrio('papel-elsa', { st: { ramal: 'salvado' }, script: [0] }, 'lazo:guarda:1') && noCorrio('papel-elsa', { st: { ramal: 'traslado' }, script: [1] }, 'lazo:guarda:2'), 'papel-elsa: Elsa +1 sin decir, +2 con la cuenta');
  ok(corrio('visita-ramon', { script: [0] }, 'lazo:ramon:1', 'raro:chocolate') && noCorrio('visita-ramon', { script: [1] }, 'lazo:ramon:1'), 'visita-ramon: hablar de Chocolate sube a Ramón');
}

// ---------------------------------------------------------------- D6: trato o pelea
{
  const e = ESCENAS_ACTO3['galpon-encuentro'];
  const con3 = correrEscena(e, { st: { 'devolver-bolsa': true } }), sin = correrEscena(e, { st: { 'devolver-bolsa': false } });
  ok(con3.elecciones.length === 1 && con3.elecciones[0].id === 'duendes' && con3.elecciones[0].n === 3, 'galpon-encuentro con la bolsa: tres opciones');
  ok(sin.elecciones.length === 1 && sin.elecciones[0].id === 'duendes-sin' && sin.elecciones[0].n === 2, 'galpon-encuentro sin la bolsa: dos opciones');
  for (const [i, x] of [[0, 'duendes:trato'], [1, 'duendes:trato-fuerte'], [2, 'duendes:pelea']]) ok(corrio('galpon-encuentro', { st: { 'devolver-bolsa': true }, script: [i] }, x) && quienes(correrEscena(e, { st: { 'devolver-bolsa': true }, script: [i] })).filter((y) => y.startsWith('duendes:')).length === 2, `galpon-encuentro: la opción ${i} guarda ${x} (y anota que los viste)`);
  ok(corrio('galpon-encuentro', { st: { 'devolver-bolsa': false }, script: [1] }, 'duendes:pelea') && noCorrio('galpon-encuentro', { st: { 'devolver-bolsa': false }, script: [1] }, 'duendes:trato-fuerte'), 'galpon-encuentro sin la bolsa: no se puede devolverla');
  ok(corrio('galpon-encuentro', { saltarAl: 3 }, 'duendes:trato') && noCorrio('galpon-encuentro', { saltarAl: 3 }, 'duendes:pelea'), 'saltar el encuentro deja la puerta abierta (trato)');
  // los duendes del galpón: diez a doce, y ninguno habla
  const g = correrEscena(e, {});
  const cant = g.corridos.filter((x) => x.nombre.startsWith('duende:galpon-') && x.nombre !== 'duende:galpon-se-congelan' && x.args && x.args.n && x.args.tipo !== 'jefe').reduce((s, x) => s + x.args.n, 0);
  ok(cant >= 10 && cant <= 12 && g.corridos.some((x) => x.args && x.args.tipo === 'jefe'), `el galpón tiene entre 10 y 12 duendes más el Mandamás (${cant})`);
  ok(corrio('galpon-golpe', {}, 'mundo:galpon-puerta-entornada', 'raro:golpe-galpon') && corrio('galpon-sin-golpear', {}, 'mundo:galpon-luz-apagada', 'mundo:galpon-luz-vuelve') && ESCENAS_ACTO3['galpon-sin-golpear'].repetible === true, 'golpear abre la puerta; abrir sin golpear apaga la luz y la devuelve (repetible)');
  // trato: la llave, la deuda por la bolsa y por la madera
  ok(corrio('galpon-trato', { st: { trato: 'trato' } }, 'objeto:llave-79', 'raro:nos-dimos-la-mano'), 'galpon-trato deja la llave del 79');
  ok(corrio('galpon-trato', { decisiones: { bolsa: 'b' } }, 'duendes:deuda-bolsa') && noCorrio('galpon-trato', { decisiones: { bolsa: 'a' } }, 'duendes:deuda-bolsa'), 'galpon-trato: la deuda de la bolsa sólo si la llevaste a Rosa');
  ok(corrio('galpon-trato', { decisiones: { coihue: 'b' } }, 'duendes:deuda-tablas') && noCorrio('galpon-trato', { decisiones: { coihue: 'a' } }, 'duendes:deuda-tablas'), 'galpon-trato: la deuda de las tablas sólo si talaste el coihue');
  ok(dice('galpon-trato', { st: { trato: 'fuerte' } }, /bolsa de harina que dejó Eusebio/) && !dice('galpon-trato', { st: { trato: 'trato' } }, /bolsa de harina que dejó Eusebio/) && dice('galpon-trato', { st: { trato: 'trato' } }, /manos vacías/) && !dice('galpon-trato', { st: { trato: 'fuerte' } }, /manos vacías/), 'galpon-trato: el trato fuerte pone la bolsa en el umbral; el común muestra las manos vacías');
  ok(corrio('galpon-pelea', {}, 'duende:mandamas-se-va', 'mundo:puertita-al-reves', 'mundo:ventana-barro-y-bellotas', 'raro:nadie-me-pego'), 'galpon-pelea: el Mandamás se va y quedan la puertita al revés y el barro');
  ok(corrio('pedir-perdon', { script: [0] }, 'duendes:perdon', 'quitar:harina:1') && corrio('pedir-perdon', { script: [2] }, 'entrega:puertita'), 'pedir-perdon: marca el perdón y gasta lo que dejás');
  ok(corrio('llave-79', {}, 'objeto:foto-de-tres', 'lazo:ema:1', 'lazo:ramon:1'), 'llave-79: la foto de los tres, Josefina +1 y Ramón +1');
  // el cerro: con Josefina (lazo ≥ +1) o con Belisario; trato (lucecitas) o pelea (los chicos suben)
  const cj = correrEscena(ESCENAS_ACTO3['cerro-mirador'], { lazos: { ema: 2 }, st: { trato: 'trato' } });
  const cb = correrEscena(ESCENAS_ACTO3['cerro-mirador'], { lazos: { ema: -2 }, st: { trato: 'pelea' } });
  ok(cj.hablantes.includes('josefina') && !cj.hablantes.includes('belisario') && cb.hablantes.includes('belisario') && !cb.hablantes.includes('josefina'), 'cerro-mirador: habla Josefina con lazo, Belisario sin él');
  ok(quienes(cj).includes('duende:lucecitas-mirador') && !quienes(cj).includes('duende:chicos-suben-cerro') && quienes(cb).includes('duende:chicos-suben-cerro') && !quienes(cb).includes('duende:lucecitas-mirador'), 'cerro-mirador: lucecitas con el trato, los chicos suben con la pelea');
  ok(dice('cerro-mirador', { lazos: { ema: 2 }, st: { trato: 'trato' } }, /Tienen miedo/) && dice('cerro-mirador', { lazos: { ema: 2 }, st: { trato: 'pelea' } }, /Se van con ellos/), 'cerro-mirador: las dos frases de Josefina');
  // la mesa: Ramón, Josefina y Fermín según el lazo; Ercilia siempre
  const mg = correrEscena(ESCENAS_ACTO3['mesa-guerra'], { lazos: { ramon: 2, ema: 2, fermin: 2 } });
  const mm = correrEscena(ESCENAS_ACTO3['mesa-guerra'], { lazos: { ramon: -2, ema: -2, fermin: -2 } });
  ok(['ramon', 'josefina', 'fermin', 'ercilia'].every((q) => mg.hablantes.includes(q)) && mm.hablantes.filter((q) => q !== 'narra').every((q) => q === 'ercilia') && mm.hablantes.includes('ercilia'), 'mesa-guerra: con buen lazo hablan todos; con mal lazo sólo Ercilia');
}

// ---------------------------------------------------------------- el arco, la honda y lo prestado
{
  ok(corrio('blancos-paso', {}, 'armas:arco') && corrio('blancos-esquila', {}, 'armas:honda') && noCorrio('blancos-paso', {}, 'armas:honda'), 'los blancos dan el arco y la honda');
  ok(corrio('blancos-paso', { saltarAl: 3 }, 'armas:arco') && corrio('blancos-esquila', { saltarAl: 3 }, 'armas:honda'), 'saltar los blancos igual deja las armas');
  ok(corrio('plumas-bosque', { script: [0] }, 'lazo:ema:-1') && noCorrio('plumas-bosque', { script: [0] }, 'lazo:ema:1') && corrio('plumas-bosque', { script: [1] }, 'lazo:ema:1'), 'plumas del bosque: Josefina −1 (y devolverlas lo compensa)');
  ok(corrio('plumas-gallinero', {}, 'lazo:ema:1') && corrio('plumas-josefina', { script: [0] }, 'lazo:ema:1'), 'plumas del gallinero y de la seccional: Josefina +1');
  ok(corrio('tito-arco', { decisiones: { coihue: 'b' } }, 'quitar:tabla-coihue:2') && noCorrio('tito-arco', { decisiones: { coihue: 'a' } }, 'quitar:tabla-coihue:2'), 'tito-arco: las dos tablas de coihue sólo si talaste');
  ok(corrio('fermin-paces', { script: [0] }, 'lazo:fermin:1', 'quitar:harina:1') && corrio('fermin-paces', { script: [2] }, 'quitar:pan-casero:1'), 'fermin-paces: Fermín +1 y gasta el regalo');
  ok(dice('fermin-honda', { decisiones: { majada: 'a' } }, /Es su forma de decir gracias/) && !dice('fermin-honda', { decisiones: { majada: 'c' } }, /Es su forma de decir gracias/), 'fermin-honda: con la majada de Fermín cuenta la visita de Ramón');
  const pres = ['prestado-herrero', 'prestado-apicultor', 'prestado-maquinista', 'prestado-guarda', 'prestado-tobias'];
  ok(pres.every((id, k) => corrio(id, { saltarAl: 3 }, `prestado:${['herrero', 'apicultor', 'maquinista', 'guarda', 'tobias'][k]}`)), 'cada cosa prestada anota quién la prestó (también al saltar)');
  ok(corrio('prestado-guarda', { script: [0] }, 'lazo:guarda:1') && corrio('prestado-tobias', { script: [0] }, 'lazo:tobias:1') && corrio('prestado-maquinista', {}, 'mundo:campana-del-taller'), 'lo prestado suma lazos y pone su prop');
  ok(corrio('deuda-pagada', { decisiones: { bolsa: 'b' } }, 'quitar:harina:1', 'duendes:deuda-pagada') && corrio('deuda-pagada', { decisiones: { coihue: 'b' } }, 'quitar:tabla-coihue:6') && noCorrio('deuda-pagada', { decisiones: { coihue: 'a', bolsa: 'a' } }, 'quitar:harina:1', 'quitar:tabla-coihue:6'), 'deuda-pagada: una bolsa si la de Rosa, seis tablas si el tocón');
  ok(corrio('recorrer-lado', { decisiones: { majada: 'c' } }, 'raro:recorrer-el-lado') && dice('recorrer-lado', { decisiones: { majada: 'a' } }, /mejor que conmigo/), 'recorrer-lado: con la majada de Fermín, Ramón dice que está mejor que con él');
  ok(corrio('flechas-de-mas', {}, 'mundo:flechas-extra') && corrio('cumple-nevada', {}, 'lazo:ercilia:1') && corrio('elvira-cuerda', {}, 'quitar:vellon:2') && corrio('anselmo-puntas', {}, 'mundo:puntas-de-flecha'), 'las optativas y los encargos del capítulo 11 suman lo suyo');
  // la cita sugerida: sólo con el amor prendido, nunca explícita
  const pn = ESCENAS_ACTO3['pareja-noche-antes'];
  ok(pn.disparador?.cond === 'amor' && /amor/.test(DISPARO_ACTO3['pareja-noche-antes'].cuando) && /nunca obligatoria/.test(DISPARO_ACTO3['pareja-noche-antes'].cuando), 'pareja-noche-antes: condición `amor` declarada en el disparador y en la tabla (nunca obligatoria)');
  ok(correrEscena(pn, { st: { amor: true } }).lineas.length >= 3 && !textosDe(pn).some((t) => MUY_EXPLICITO.test(t) || EXPLICITO.test(t)), 'pareja-noche-antes: sugerida, sin nada explícito');
}

// ---------------------------------------------------------------- la noche
{
  const t = correrEscena(ESCENAS_ACTO3['noche-espera'], { lazos: { ramon: 2, ema: 2, fermin: 3 }, decisiones: { cuaderno: 'a' }, st: { trato: 'trato', perro: true } });
  const p = correrEscena(ESCENAS_ACTO3['noche-espera'], { st: { trato: 'pelea' }, lazos: { ramon: 2, ema: 2, fermin: 3 } });
  ok(quienes(t).includes('duende:lucecitas-raices') && !quienes(t).includes('duende:ojos-verdes') && quienes(p).includes('duende:ojos-verdes') && !quienes(p).includes('duende:lucecitas-raices'), 'noche-espera: lucecitas con el trato, ojos verdes con la pelea');
  ok(t.corridos.find((x) => x.nombre === 'duende:lucecitas-raices').args.n === 20 && t.mundo.sonidos.filter((s) => s === 'campana').length >= 3 && quienes(t).includes('mundo:faroles-en-la-loma'), 'noche-espera: veinte lucecitas, la campana tres veces y la aldea en la loma (D4 = a)');
  ok(!quienes(correrEscena(ESCENAS_ACTO3['noche-espera'], { decisiones: { cuaderno: 'b' } })).includes('mundo:faroles-en-la-loma'), 'noche-espera: sin faroles si no contaste lo del cuaderno');
  ok(t.hablantes.includes('josefina') && p.hablantes.includes('ramon'), 'noche-espera: Josefina con el trato, Ramón con la pelea');
  ok(dice('noche-espera', { lazos: { fermin: 3 } }, /Fermín trepó al techo/) && !dice('noche-espera', { lazos: { fermin: 0 } }, /Fermín trepó al techo/) && dice('noche-espera', { st: { perro: true } }, /Tu perro está pegado/) && !dice('noche-espera', {}, /Tu perro está pegado/), 'noche-espera: Fermín en el techo sólo con lazo +2 o más, y el perro sólo si tenés');
  const tp = correrEscena(ESCENAS_ACTO3['noche-tras-perder'], { script: [0] }), tq = correrEscena(ESCENAS_ACTO3['noche-tras-perder'], { script: [1] });
  ok(quienes(tp).includes('noche:reintentar') && !quienes(tp).includes('noche:perdida') && tp.mundo.horas.includes(22) && quienes(tq).includes('noche:perdida') && !quienes(tq).includes('noche:reintentar') && !tq.mundo.horas.includes(22), 'noche-tras-perder: «Otra vez» vuelve a las 22; «Que amanezca» deja la noche perdida');
  ok(corrio('noche-tras-perder', { saltarAl: 3 }, 'noche:reintentar'), 'saltar la pérdida de la noche reintenta (sin castigo)');
  ok(dice('noche-entre-1', { decisiones: { cuaderno: 'a' } }, /aplausos/) && !dice('noche-entre-1', { decisiones: { cuaderno: 'b' } }, /aplausos/), 'noche-entre-1: los aplausos de la loma sólo si contaste lo del cuaderno (D4 = a)');
  ok(correrEscena(ESCENAS_ACTO3['noche-entre-1'], { script: [0] }).mundo.sonidos.includes('campana') && correrEscena(ESCENAS_ACTO3['noche-entre-2'], {}).mundo.sonidos.filter((s) => s === 'campana').length >= 3, 'entre las olas la campana avisa');
  // los cuatro amaneceres
  ok(corrio('amanecer-trato-ganada', { lazos: { ema: 2 } }, 'objeto:canto-gemelo', 'duende:gorra-torcida-saluda', 'duende:lucecitas-rodean-galpon') && dice('amanecer-trato-ganada', { lazos: { ema: 2 } }, /primera vez que me río/), 'amanecer del trato ganado: el canto gemelo y Josefina se ríe por primera vez');
  ok(corrio('amanecer-trato-perdida', {}, 'duende:chicos-arreglan-galpon', 'raro:amanecer-torcido') && dice('amanecer-trato-perdida', { lazos: { ramon: 2 } }, /Igualito que vos el primer día/), 'amanecer del trato perdido: los chicos arreglan el galpón y Ramón lo compara con vos');
  ok(corrio('amanecer-pelea-ganada', {}, 'duende:mandamas-al-bosque', 'raro:amanecer-de-la-pelea') && dice('amanecer-pelea-ganada', { lazos: { ema: 2 } }, /por qué no se siente como ganar/i), 'amanecer de la pelea ganada: el Mandamás baja la cabeza; Josefina no siente que ganó');
  ok(dice('amanecer-pelea-perdida', {}, /perdemos todos un poquito/) && corrio('amanecer-pelea-perdida', {}, 'raro:amanecer-de-todos'), 'amanecer de la pelea perdida: Ercilia y los vecinos con bolsas');
  for (const id of ['amanecer-trato-ganada', 'amanecer-trato-perdida', 'amanecer-pelea-ganada', 'amanecer-pelea-perdida']) {
    ok(dice(id, { st: { amor: true } }, /./) && correrEscena(ESCENAS_ACTO3[id], { st: { amor: true } }).hablantes.includes('pareja') && !correrEscena(ESCENAS_ACTO3[id], { st: { amor: false } }).hablantes.includes('pareja'), `${id}: la pareja está al amanecer sólo con el amor prendido`);
  }
}

// ---------------------------------------------------------------- el epílogo y los dos finales
{
  for (const [nivel, efecto] of [['salvado', 'mundo:ramal-salvado'], ['prueba', 'mundo:ramal-a-prueba'], ['traslado', 'mundo:elsa-se-va']]) {
    const q = quienes(correrEscena(ESCENAS_ACTO3['carpeta-celeste'], { st: { ramal: nivel } }));
    ok(q.includes(efecto) && ['mundo:ramal-salvado', 'mundo:ramal-a-prueba', 'mundo:elsa-se-va'].filter((x) => q.includes(x)).length === 1, `carpeta-celeste con el ramal ${nivel}: ${efecto} y nada más`);
  }
  ok(corrio('carpeta-celeste', { st: { ramal: 'traslado' } }, 'objeto:silbato-de-elsa') && dice('carpeta-celeste', { st: { ramal: 'salvado' } }, /Cuarenta toneladas no son/) && dice('carpeta-celeste', { st: { ramal: 'prueba' } }, /Un año a prueba/) && dice('carpeta-celeste', { st: { ramal: 'traslado' } }, /Manéjelo con las orejas/), 'carpeta-celeste: tres desenlaces del ramal (se salva, a prueba, Elsa se va con el silbato)');
  ok(corrio('carpeta-celeste', { lazos: { graciela: 3 } }, 'mundo:graciela-se-queda') && noCorrio('carpeta-celeste', { lazos: { graciela: 1 } }, 'mundo:graciela-se-queda') && dice('carpeta-celeste', { lazos: { graciela: 3 } }, /Pedí el traslado/), 'carpeta-celeste: con el lazo de Graciela en +3 pide el traslado al valle');
  // los de la majada
  ok(corrio('majada-fin', { decisiones: { majada: 'a' } }, 'mundo:cartel-puesto-catrileo', 'lazo:ramon:3') && dice('majada-fin', { decisiones: { majada: 'a' } }, /Las tiene… bien/), 'majada-fin con D5 = a: el cartel «Puesto Catrileo» y Ramón suelta');
  ok(corrio('majada-fin', { decisiones: { majada: 'b' }, lazos: { fermin: -2 } }, 'mundo:fermin-se-fue') && dice('majada-fin', { decisiones: { majada: 'b' }, lazos: { fermin: -2 } }, /Acá también hay viento/) && corrio('majada-fin', { decisiones: { majada: 'b' }, lazos: { fermin: 1 } }, 'lazo:fermin:1') && noCorrio('majada-fin', { decisiones: { majada: 'b' }, lazos: { fermin: 1 } }, 'mundo:fermin-se-fue'), 'majada-fin con D5 = b: Fermín se va con las mulas (lazo negativo) o se queda de medianero');
  ok(corrio('majada-fin', { decisiones: { majada: 'c' } }, 'optativa:volver-a-subir') && noCorrio('majada-fin', { decisiones: { majada: 'a' } }, 'optativa:volver-a-subir') && corrio('majada-fin', { lazos: { ramon: 3 } }, 'objeto:mate-de-chocolate') && noCorrio('majada-fin', { lazos: { ramon: 1 } }, 'objeto:mate-de-chocolate'), 'majada-fin: «volver a subir» sólo si vendiste; el mate de Chocolate sólo con el lazo de Ramón en +3');
  const vs = correrEscena(ESCENAS_ACTO3['volver-a-subir'], {});
  ok(quienes(vs).includes('lazo:ramon:3') && vs.lineas.some((l) => /La majada era una excusa/.test(l)) && vs.mundo.horas.length >= 1, 'volver-a-subir: Ramón sube de lazo y dice la frase; pasa una hora');
  // Josefina y el cuaderno
  ok(corrio('josefina-fin', { decisiones: { cuaderno: 'b' } }, 'objeto:cuaderno-del-abuelo') && corrio('josefina-fin', { decisiones: { cuaderno: 'c' } }, 'mundo:cartel-arbol-notable') && corrio('josefina-fin', { decisiones: { cuaderno: 'a' } }, 'mundo:chicos-dibujan-puertitas'), 'josefina-fin: la escuela (A), el cuaderno en tu repisa (B), el árbol notable (C)');
  ok(dice('josefina-fin', { decisiones: { cuaderno: 'a' } }, /Me entendieron mejor que los de Parques/) && dice('josefina-fin', { decisiones: { cuaderno: 'c' } }, /Ahora sí da miedo/) && dice('josefina-fin', { decisiones: { cuaderno: 'b' } }, /Acá alguien lo cuida/), 'josefina-fin: sus tres frases');
  ok(dice('josefina-fin', { decisiones: { coihue: 'b' } }, /tocón ancho como una mesa/) && !dice('josefina-fin', { decisiones: { coihue: 'a' } }, /tocón ancho como una mesa/), 'josefina-fin: con el coihue talado la escena pasa junto al tocón');
  // el umbral: los dos finales
  const ua = correrEscena(ESCENAS_ACTO3['umbral-fin'], { st: { trato: 'trato' }, decisiones: { coihue: 'a' } });
  const ut = correrEscena(ESCENAS_ACTO3['umbral-fin'], { st: { trato: 'trato' }, decisiones: { coihue: 'b' } });
  const ub = correrEscena(ESCENAS_ACTO3['umbral-fin'], { st: { trato: 'pelea', perdon: false } });
  const up = correrEscena(ESCENAS_ACTO3['umbral-fin'], { st: { trato: 'pelea', perdon: true } });
  ok(['mundo:ronda-ramitas-final', 'mundo:bolsa-vacia-doblada', 'mundo:puertita-nueva-en-la-raiz', 'mundo:puertita-repisa-abre', 'mundo:costumbre-del-trato'].every((x) => quienes(ua).includes(x)) && !quienes(ua).includes('mundo:puertitas-vacias') && !quienes(ua).includes('mundo:canto-blanco-queda'), 'final A (el trato): ronda, canto, bolsa vacía doblada, puertita nueva y la costumbre');
  ok(['mundo:puertitas-vacias', 'mundo:canto-blanco-queda'].every((x) => quienes(ub).includes(x)) && !quienes(ub).includes('mundo:costumbre-del-trato') && !quienes(ub).includes('mundo:bolsa-vacia-doblada') && !quienes(ub).includes('mundo:bellota-derecha') && quienes(up).includes('mundo:bellota-derecha'), 'final B (la pelea): umbral vacío, puertitas vacías; la bellota sólo si pediste perdón');
  ok(ut.corridos.some((x) => x.nombre === 'perfil:del-valle') && ub.corridos.some((x) => x.nombre === 'perfil:del-valle') && ua.corridos.some((x) => x.nombre === 'mundo:arco-y-honda-en-la-pared'), 'los dos finales dan el título «Del valle» y cuelgan el arco y la honda');
  ok(dice('umbral-fin', { st: { trato: 'pelea' } }, /./) && correrEscena(ESCENAS_ACTO3['umbral-fin'], { st: { trato: 'pelea' } }).hablantes.every((q) => q !== 'pareja') && correrEscena(ESCENAS_ACTO3['umbral-fin'], { st: { amor: true } }).hablantes.includes('pareja'), 'umbral-fin: la pareja sólo con el amor prendido');
  ok(ESCENAS_ACTO3['costumbre-dejar'].repetible === true && ESCENAS_ACTO3['costumbre-regalito'].repetible === true && corrio('costumbre-dejar', {}, 'mundo:bolsa-llena-en-umbral', 'quitar:harina:1') && corrio('costumbre-regalito', {}, 'mundo:regalito-umbral'), 'la costumbre del trato: dejar la bolsa llena y el regalito a la mañana, repetibles');
  ok(corrio('fiesta-nieve', { st: { amor: true } }, 'raro:fiesta-de-la-nieve') && corrio('herminia-estacion', {}, 'raro:herminia-y-la-nevada'), 'la fiesta y la estación corren');
}

// ---------------------------------------------------------------- tarjetas, finales y charla (funciones de consulta)
{
  const dif = (nn, d, o = {}) => new Set(['a', 'b', 'c'].map((v) => cierreDe3(nn, { [d]: v }, o).at(-1))).size === 3;
  ok(dif(9, 'majada') && cierreDe3(9, {}).length === TEXTO_ACTO3.capitulos[9].cierre.base.length && cierreDe3(9, { majada: null }).length === TEXTO_ACTO3.capitulos[9].cierre.base.length, 'el cierre del 9 cambia con la majada y sin decisión es la base');
  ok(cierreDe3(10, {}, { trato: 'trato' }).at(-1) !== cierreDe3(10, {}, { trato: 'pelea' }).at(-1) && /Las huellas salían del galpón en fila/.test(cierreDe3(10, {}, { trato: 'fuerte' }).at(-1)) && /Una sola fila iba despacio/.test(cierreDe3(10, {}, { trato: 'pelea' }).at(-1)), 'el cierre del 10 cambia con el trato (el fuerte cuenta como trato)');
  ok(/Ganes o pierdas/.test(cierreDe3(12, {}).join(' ')) && cierreDe3(12, {}, { noche: 'ganada' }).at(-1) !== cierreDe3(12, {}, { noche: 'perdida' }).at(-1) && cierreDe3(14).length === 0, 'el cierre del 12 cambia con la noche; un capítulo inexistente da vacío');
  ok(entradaDe3(9, {}, { puerta: 'temprano' }).length === 1 && /primera helada/.test(entradaDe3(9, {}, { puerta: 'temprano' })[0]) && entradaDe3(9, {}, { puerta: 'tarde' }).length === entradaDe3(9).length + 1 && /antes de lo previsto/.test(entradaDe3(9, {}, { puerta: 'tarde' })[0]), 'entrada del 9: la tarjeta corta de espera y la helada a destiempo');
  ok(new Set(['a', 'b', 'c'].map((v) => entradaDe3(10, { majada: v }).at(-1))).size === 3 && new Set(['a', 'b', 'c'].map((v) => entradaDe3(11, { majada: v }).at(-1))).size === 3 && entradaDe3(12, {}, { trato: 'pelea' }).length === 3 && entradaDe3(12, {}).length === 2, 'las entradas del 10, el 11 y el 12 suman una frase por la majada o el trato');
  ok(/lana a precio de amigo/.test(premioDe3(9, { majada: 'a' })) && /vellones/.test(premioDe3(9, { majada: 'b' })) && /pesos de la venta/.test(premioDe3(9, { majada: 'c' })) && !/vellones|pesos|lana/.test(premioDe3(9, {})), 'el premio del 9 según la majada');
  ok(/llave del 79/.test(premioDe3(10, {}, { trato: 'trato' })) && /puertita al revés/.test(premioDe3(10, {}, { trato: 'pelea' })) && /canto blanco gemelo/.test(premioDe3(12, {}, { trato: 'trato' })) && /vecinos/.test(premioDe3(12, {}, { trato: 'pelea' })) && /arco y la honda/.test(premioDe3(11)) && /Del valle/.test(premioDe3(13)), 'premios de los capítulos 10 a 13');
  ok(paginaTratosDe3({}).length === 1 && paginaTratosDe3({ majada: 'a' }, { trato: 'pelea' }).length === 3 && /cerró la puerta/i.test(paginaTratosDe3({}, { trato: 'pelea' }).join(' ')) && /esperó sentado/.test(paginaTratosDe3({}, { trato: 'trato' }).join(' ')), 'la página de tratos del invierno suma el trato y la majada');
  // los finales: dos distintos, con piezas
  const base = { decisiones: { bolsa: 'a', coihue: 'a', molienda: 'a', cuaderno: 'a', majada: 'a' }, ramal: 11, lazos: {}, noche: 'ganada' };
  const fa = finalDe3({ ...base, trato: 'trato' }), fb = finalDe3({ ...base, trato: 'pelea' });
  ok(/^El trato\./.test(fa[0]) && /^La pelea\./.test(fb[0]) && /Hay que tener trato/.test(fa.join(' ')) && /Vos la dejás/.test(fb.join(' ')) && !fa.join(' ').includes('Vos la dejás') && !fb.join(' ').includes('Cada cosecha, una bolsa'), 'los dos finales son distintos');
  ok(/silbato largo/.test(fa.join(' ')) && /tres veces por semana/.test(finalDe3({ ...base, ramal: 7 }).join(' ')) && /tres veces por semana/.test(finalDe3({ ...base, ramal: 2 }).join(' ')) && /silbato de guarda/.test(finalDe3({ ...base, ramal: 2, lazos: { guarda: 2 } }).join(' ')) && !/silbato de guarda/.test(fa.join(' ')), 'el final cuenta el ramal (salvado, a prueba, Elsa en Esquel)');
  ok(/puesto nuevo/.test(fa.join(' ')) && /puertas?|Puesto|puesto/.test(fa.join(' ')) && /dibujan puertitas/.test(fa.join(' ')) && /cartelito/.test(finalDe3({ ...base, decisiones: { ...base.decisiones, cuaderno: 'c' } }).join(' ')) && /repisa/.test(finalDe3({ ...base, decisiones: { ...base.decisiones, cuaderno: 'b' } }).join(' ')), 'el final cuenta la majada (D5) y el cuaderno (D4)');
  ok(/piolín colorado/.test(fa.join(' ')) && /pan de Rosa/.test(finalDe3({ ...base, decisiones: { ...base.decisiones, bolsa: 'b' } }).join(' ')) && /nota de Eusebio/.test(finalDe3({ ...base, decisiones: { ...base.decisiones, bolsa: 'c' } }).join(' ')), 'el final cuenta la bolsa (D1)');
  ok(/en pie/.test(fa.join(' ')) && /brotes verdes/.test(finalDe3({ ...base, decisiones: { ...base.decisiones, coihue: 'b' } }).join(' ')) && /pirca/.test(finalDe3({ ...base, decisiones: { ...base.decisiones, coihue: 'c' } }).join(' ')), 'el final cuenta el coihue (D2)');
  ok(/fletes/.test(fa.join(' ')) && /fiado largo/.test(finalDe3({ ...base, decisiones: { ...base.decisiones, molienda: 'b' } }).join(' ')) && /regla de oro/.test(finalDe3({ ...base, decisiones: { ...base.decisiones, molienda: 'c' } }).join(' ')), 'el final cuenta la molienda (D3)');
  ok(/casa cerca de la estación/.test(finalDe3({ ...base, lazos: { graciela: 3 } }).join(' ')) && !/casa cerca de la estación/.test(fa.join(' ')) && /mate de Chocolate/.test(finalDe3({ ...base, lazos: { ramon: 3 } }).join(' ')) && /nombre en la última hoja/.test(finalDe3({ ...base, lazos: { ema: 3 } }).join(' ')), 'el final cuenta a Graciela, Ramón y Josefina según el lazo');
  ok(/pared nueva, mal clavada/.test(finalDe3({ ...base, noche: 'perdida' }).join(' ')) && !/pared nueva/.test(fa.join(' ')) && /bellota derecha/.test(finalDe3({ ...base, trato: 'pelea', perdon: true }).join(' ')) && !/bellota derecha/.test(fb.join(' ')) && /te sigue esperando/.test(finalDe3({ ...base, amor: true }).join(' ')) && !/te sigue esperando/.test(fa.join(' ')), 'el final cuenta la noche perdida, el perdón y, con el amor prendido, a quien te esperó');
  ok(fa.at(-1) === fb.at(-1) && /nadie tiene apuro/.test(fa.at(-1)) && finalDe3({}).length >= 4, 'el final siempre cierra igual; sin estado también arma una tarjeta');
  // la charla
  ok(charlaDe3('ramon', 9, {})?.id === 'ramon-c9-cama' && charlaDe3('ramon', 9, { decisiones: { majada: 'c' } })?.id === 'ramon-c9-vendida' && charlaDe3('ramon', 9, { decisiones: { majada: 'a' } })?.id === 'ramon-c9-fermin', 'charla de Ramón en el capítulo 9 según la majada');
  ok(charlaDe3('ramon', 12, {})?.id === 'ramon-c12-noche' && charlaDe3('ramon', 13, {})?.id === 'ramon-c13-nieve' && charlaDe3('ramon', 11, {})?.id === 'ramon-c11-martillo', 'en cada capítulo gana la línea más nueva');
  ok(charlaDe3('josefina', 10, { trato: 'trato' })?.id === 'josefina-c10-trato' && charlaDe3('josefina', 10, { trato: 'fuerte' })?.id === 'josefina-c10-trato' && charlaDe3('josefina', 10, { trato: 'pelea' })?.id === 'josefina-c10-pelea', 'Josefina habla distinto después del encuentro (el fuerte cuenta como trato)');
  ok(charlaDe3('josefina', 13, { decisiones: { cuaderno: 'a' } })?.id === 'josefina-c13-cuaderno' && charlaDe3('josefina', 13, { decisiones: { cuaderno: 'c' } })?.cap === 12, 'Josefina en el epílogo según el cuaderno; sin condición sigue la del capítulo anterior');
  ok(charlaDe3('herminia', 13, { trato: 'pelea' })?.id === 'herminia-c13-puerta' && charlaDe3('herminia', 13, { trato: 'trato' })?.id === 'herminia-c13-trato' && charlaDe3('nicanor', 12, { noche: 'ganada' })?.id === 'nicanor-c12-ola' && charlaDe3('nicanor', 12, { noche: 'perdida' })?.cap === 11, 'las charlas cambian con el trato y con la noche');
  ok(charlaDe3('tito', 11, { escenas: ['tito-arco'] })?.id === 'tito-c11-arco' && charlaDe3('tito', 11, {})?.cap === 10 && charlaDe3('fermin', 11, { escenas: ['blancos-esquila'] })?.id === 'fermin-c11-latas', 'las escenas vistas cambian la charla');
  ok(charlaDe3('nadie', 10, {}) === null && charlaDe3('marta', 8, {}) === null && charlaDe3('marta', 9, {})?.id === 'marta-c9-cadera', 'sin charla para quien no está o antes de tiempo');
  ok(Object.hasOwn(TEXTO_ACTO3.charla, 'constructor') === false && Object.hasOwn(TEXTO_ACTO3.capitulos, 'constructor') === false, 'sin claves peligrosas');
}

// ---------------------------------------------------------------- los pedidos para el agente A están anotados, y los módulos son seguros para el empaquetador
{
  const cambios = existsSync(join(raiz, 'CAMBIOS_4_17_0_B.md')) ? leer('CAMBIOS_4_17_0_B.md') : '';
  ok(cambios.length > 4000, 'existe CAMBIOS_4_17_0_B.md');
  for (const id of IDS_ACTO3) ok(cambios.includes('`' + id + '`'), `CAMBIOS_4_17_0_B.md lista la escena «${id}» en la tabla de ids`);
  for (const nombre of EFECTOS_ACTO3.map((x) => x.split(':')[0]).filter((x, i, a) => a.indexOf(x) === i)) ok(cambios.includes(`${nombre}:`), `CAMBIOS_4_17_0_B.md documenta la convención «${nombre}:»`);
  for (const cond of CONDICIONES_ACTO3) ok(cambios.includes(cond), `CAMBIOS_4_17_0_B.md documenta la condición «${cond}»`);
  for (const nombre of EFECTOS_ACTO3.filter((x) => x.startsWith('duende:') || x.startsWith('mundo:') || x.startsWith('duendes:') || x.startsWith('noche:') || x.startsWith('armas:') || x.startsWith('perfil:'))) ok(cambios.includes('`' + nombre + '`'), `CAMBIOS_4_17_0_B.md documenta el efecto «${nombre}»`);
  ok(cambios.includes('graciela') && cambios.includes('pareja'), 'CAMBIOS_4_17_0_B.md anota los personajes que faltan (Graciela y la pareja)');
  ok(!/scratch/i.test(cambios), 'los cambios no mencionan lo que no se menciona');
  const modulos = ['src/historia-escenas-acto3.js', 'src/historia-escenas-acto3-util.js', 'src/historia-escenas-acto3-c9.js', 'src/historia-escenas-acto3-c10.js', 'src/historia-escenas-acto3-c11.js', 'src/historia-escenas-acto3-c11b.js', 'src/historia-escenas-acto3-c12.js', 'src/historia-escenas-acto3-c13.js', 'src/historia-texto-acto3.js'];
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
  // los nombres exportados no chocan con los de los actos I y II (el que los importa los junta en un solo módulo)
  const previos = ['src/historia-escenas-acto1.js', 'src/historia-texto-acto1.js', 'src/historia-escenas-acto2.js', 'src/historia-texto-acto2.js', 'src/historia-escenas-util.js', 'src/historia-escenas-acto2-util.js'].map(leer).join('\n');
  for (const a of modulos) for (const m of leer(a).matchAll(/^export\s+(?:const|function)\s+([A-Za-z0-9_$]+)/gm)) ok(!new RegExp(`^export\\s+(?:const|function)\\s+${m[1]}\\b`, 'm').test(previos), `${a}: el nombre «${m[1]}» ya existe en los actos I o II`);
  const otros = modulos.filter((a) => a !== 'src/historia-escenas-acto3-util.js').map((a) => leer(a)).join('\n') + leer('src/historia-escenas-acto3-util.js');
  const nombres = [...otros.matchAll(/^export\s+(?:const|function)\s+([A-Za-z0-9_$]+)/gm)].map((m) => m[1]);
  ok(new Set(nombres).size === nombres.length, 'los nombres exportados del acto III no se repiten entre módulos');
  ok(Object.keys(POSE_DE).length >= 15 && Object.values(POSE_DE).every((p) => POSES_ESCENA.includes(p)), 'la tabla de gestos del guion sólo apunta a poses que existen');
  ok(Object.values(PERSONAJES_ACTO3).every((p) => typeof p.nombre === 'string' && Object.hasOwn(p, 'clave') && /^#[0-9a-f]{6}$/i.test(p.color)), 'los personajes del acto III están completos');
  ok(MAX_OPCIONES >= 3, 'el motor admite 3 opciones');
}

// ---------------------------------------------------------------- MUTACIONES: se rompe una garantía de los datos y la suite tiene que fallar
const clon = (o) => JSON.parse(JSON.stringify(o));
function mutante(tocar) {
  const e = clon(ESCENAS_ACTO3), t = clon(TEXTO_ACTO3), fu = { claves: new Set(CLAVES), lugares: new Set(LUGARES), disparo: clon(DISPARO_ACTO3), textoJuego: fuentes.textoJuego };
  tocar(e, t, fu);
  return suite(e, t, fu);
}
const primeroDialogo = (e) => e.pasos.find((p) => p.tipo === 'dialogo');
const eleccionDe = (e, id) => e.pasos.find((p) => p.tipo === 'eleccion' && p.id === id);
const MUTACIONES = [
  ['falta una escena', (e) => { delete e['umbral-fin']; }],
  ['una escena de más', (e) => { e['extra-uno'] = { ...clon(e['flechas-de-mas']), id: 'extra-uno' }; }],
  ['el id no coincide con la clave', (e) => { e['carpeta-celeste'].id = 'carpeta-azul'; }],
  ['un id que choca con el acto II', (e) => { const x = clon(e['flechas-de-mas']); delete e['flechas-de-mas']; e['cuaderno-1'] = { ...x, id: 'cuaderno-1' }; }],
  ['un plano desconocido', (e) => { e['galpon-golpe'].pasos.find((p) => p.tipo === 'plano').plano = 'cenital'; }],
  ['un paso sin tipo', (e) => { e['galpon-golpe'].pasos.push({ tipo: 'volar' }); }],
  ['una opción sin efecto ni sabor', (e) => { delete eleccionDe(e['ramon-cama'], 'cama-resp').opciones[1].sabor; }],
  ['una opción con efecto y sabor', (e) => { eleccionDe(e['ramon-cama'], 'cama-resp').opciones[0].sabor = true; }],
  ['cuatro opciones', (e) => { eleccionDe(e['fermin-tranquera'], 'majada').opciones.push({ id: 'd', texto: 'Prenderle fuego.', sabor: true }); }],
  ['una línea larguísima', (e) => { primeroDialogo(e['carpeta-celeste']).lineas[0] = 'Hola. ' + 'muy largo '.repeat(40); }],
  ['una opción larguísima', (e) => { eleccionDe(e['ramon-cama'], 'cama-resp').opciones[0].texto = 'Primero la fiebre, Don Ramón, y después todo lo demás que haga falta '.repeat(3); }],
  ['inglés en una línea', (e) => { primeroDialogo(e['mesa-guerra']).lineas.push('Una frase con the adentro'); }],
  ['una palabra religiosa', (e) => { primeroDialogo(e['mesa-guerra']).lineas.push('Que Dios lo bendiga, m\'hijo.'); }],
  ['una palabra religiosa suave', (e) => { primeroDialogo(e['mesa-guerra']).lineas.push('Ayer fui a ver una tumba vieja.'); }],
  ['una palabra explícita', (e) => { primeroDialogo(e['cumple-nevada']).lineas.push('Qué sexo tan raro.'); }],
  ['lo sensual demasiado explícito', (e) => { primeroDialogo(e['pareja-noche-antes']).lineas.push('Se besan en la cama.'); }],
  ['una cosa que no existe en el juego', (e) => { primeroDialogo(e['carpeta-celeste']).lineas.push('Graciela se fue al hospedaje.'); }],
  ['una persona que no existe', (e) => { primeroDialogo(e['carpeta-celeste']).lineas.push('Esto me lo dijo la tía Hortensia.'); }],
  ['un hablante sin declarar', (e) => { primeroDialogo(e['ramon-cama']).quien = 'ramoncito'; }],
  ['un duende que habla', (e) => { e['galpon-encuentro'].personajes.mandamas = { clave: null, nombre: 'Mandamás', color: '#aabbcc' }; e['galpon-encuentro'].pasos.push({ tipo: 'dialogo', quien: 'mandamas', lineas: ['Hola.'] }); }],
  ['una clave de personaje que no existe', (e) => { e['prestado-herrero'].personajes.anselmo.clave = 'anselmo2'; }],
  ['un lugar que no existe', (e) => { e['carpeta-celeste'].pasos.find((p) => p.tipo === 'plano' && p.a && p.a.lugar).a = { lugar: 'aeropuerto' }; }],
  ['un efecto fuera de la convención', (e) => { e['umbral-fin'].pasos.push({ tipo: 'efecto', nombre: 'regalo:muchos' }); }],
  ['un efecto nuevo con id que no existe', (e) => { e['galpon-trato'].pasos.push({ tipo: 'efecto', nombre: 'duendes:conquista' }); }],
  ['un lazo exagerado', (e) => { e['umbral-fin'].pasos.push({ tipo: 'efecto', nombre: 'lazo:ercilia:9' }); }],
  ['una condición que no está en la convención', (e) => { e['galpon-golpe'].pasos.push({ tipo: 'dialogo', quien: 'narra', lineas: ['Hola.'], si: { cond: 'magia', args: {} } }); }],
  ['un raro sin texto', (e) => { e['galpon-golpe'].pasos.push({ tipo: 'efecto', nombre: 'raro:golpe-fantasma' }); }],
  ['un objeto sin texto', (e) => { e['galpon-trato'].pasos.push({ tipo: 'efecto', nombre: 'objeto:llave-del-80' }); }],
  ['una escena efímera', (e) => { e['galpon-golpe'].efimera = true; }],
  ['una escena sin resumen', (e) => { delete e['volver-a-subir'].resumen; }],
  ['una escena con un solo plano', (e) => { const pl = e['flechas-de-mas'].pasos.filter((p) => p.tipo === 'plano'); e['flechas-de-mas'].pasos = e['flechas-de-mas'].pasos.filter((p) => !pl.slice(1).includes(p)); }],
  ['una escena sin diálogo', (e) => { e['costumbre-regalito'].pasos = e['costumbre-regalito'].pasos.filter((p) => p.tipo !== 'dialogo' && p.tipo !== 'eleccion'); }],
  ['una pose que no existe', (e) => { e['cena-caliente'].pasos.push({ tipo: 'gesto', quien: 'narra', accion: 'posar', pose: 'volar' }); }],
  ['la pareja sin la condición del amor', (e) => { e['umbral-fin'].pasos.push({ tipo: 'dialogo', quien: 'pareja', lineas: ['Hola.'] }); }],
  ['falta la tabla de disparo de una escena', (e, t, fu) => { delete fu.disparo['umbral-fin']; }],
  ['un objetivo de disparo que no existe', (e, t, fu) => { fu.disparo['carpeta-celeste'].objetivo = 'no-existe'; }],
  ['el capítulo de la tabla no coincide', (e, t, fu) => { fu.disparo['fiesta-nieve'].cap = 12; }],
  ['el cierre del capítulo 9 sin una variante', (e, t) => { delete t.capitulos[9].cierre.segun.b; }],
  ['el cierre del capítulo 10 sin las dos variantes del trato', (e, t) => { delete t.capitulos[10].cierre.segunTrato.pelea; }],
  ['el cierre del capítulo 12 sin la noche', (e, t) => { delete t.capitulos[12].cierre.segunNoche; }],
  ['el premio del capítulo 12 sin el trato', (e, t) => { delete t.capitulos[12].premio.segunTrato; }],
  ['la puerta de estación sin la tarjeta tardía', (e, t) => { delete t.capitulos[9].puerta.tarde; }],
  ['un capítulo sin premio', (e, t) => { delete t.capitulos[11].premio.texto; }],
  ['una entrada de lo raro incompleta', (e, t) => { delete t.raro['la-espera'].texto; }],
  ['una entrada de lo raro huérfana', (e, t) => { t.raro['indicio-suelto'] = { titulo: 'Suelto', texto: 'Esto no lo anota ninguna escena nunca.', cap: 11, donde: 'valle' }; }],
  ['inglés en una tarjeta', (e, t) => { t.capitulos[11].entrada.push('The valley is waiting for you'); }],
  ['religión en una nota', (e, t) => { t.notas['cuaderno-4'].texto.push('Rezá antes de abrir.'); }],
  ['un párrafo de tarjeta enorme', (e, t) => { t.capitulos[13].cierre.base.push('Muy largo. '.repeat(60)); }],
  ['un vecino sin charla', (e, t) => { t.charla.marta = []; }],
  ['una nota que falta', (e, t) => { delete t.notas['informe-cierre']; }],
  ['un objeto que falta', (e, t) => { delete t.objetos['mate-de-chocolate']; }],
  ['unos créditos que faltan', (e, t) => { t.creditos = []; }],
  ['la decisión de la majada sin una opción', (e) => { eleccionDe(e['fermin-tranquera'], 'majada').opciones[2].efecto = 'decision:majada:a'; }],
  ['la decisión de la majada con otro defecto', (e) => { eleccionDe(e['fermin-tranquera'], 'majada').porDefecto = 1; }],
  ['el encuentro sin la salida del trato fuerte', (e) => { eleccionDe(e['galpon-encuentro'], 'duendes').opciones[1].efecto = 'duendes:trato'; }],
  ['el encuentro con la opción de devolver la bolsa siempre', (e) => { delete eleccionDe(e['galpon-encuentro'], 'duendes').si; }],
  ['el encuentro con otro defecto', (e) => { eleccionDe(e['galpon-encuentro'], 'duendes-sin').porDefecto = 1; }],
  ['la noche perdida sin «Otra vez»', (e) => { eleccionDe(e['noche-tras-perder'], 'perdida-resp').opciones[0].efecto = 'noche:perdida'; }],
  ['una elección repetida entre escenas', (e) => { eleccionDe(e['cerro-mirador'], 'mirador-resp').id = 'cama-resp'; }],
  ['una elección repetida con el acto II', (e) => { eleccionDe(e['cerro-mirador'], 'mirador-resp').id = 'cuaderno'; }],
  ['un paso que mira una elección inexistente', (e) => { e['galpon-golpe'].pasos.push({ tipo: 'dialogo', quien: 'narra', lineas: ['Hola.'], si: { eleccion: 'no-hay', es: 'a' } }); }],
  ['un duende de un tipo que no existe', (e) => { e['cerro-mirador'].pasos.push({ tipo: 'efecto', nombre: 'duende:volador-raro', args: { tipo: 'dragon' } }); }],
  ['una elección que salta a una etiqueta inexistente', (e) => { eleccionDe(e['ramon-cama'], 'cama-resp').opciones[0].a = 'nunca'; }],
  ['un salto a una etiqueta inexistente', (e) => { e['majada-fin'].pasos.find((p) => p.tipo === 'salto').a = 'nunca'; }],
];
let atrapadas = 0;
for (const [nombre, tocar] of MUTACIONES) {
  const fs_ = mutante(tocar);
  if (fs_.length) atrapadas++; else console.log('NO ATRAPÓ la mutación: ' + nombre);
  ok(fs_.length > 0, `la prueba atrapa la mutación «${nombre}»`);
}
ok(atrapadas === MUTACIONES.length && MUTACIONES.length >= 50, `atrapó ${atrapadas} de ${MUTACIONES.length} mutaciones`);
// la suite sobre los datos reales no se rompe por sí sola: una copia exacta pasa
ok(mutante(() => {}).length === 0, 'una copia exacta de los datos pasa la suite');

console.log(fallas ? `FALLARON ${fallas} de ${n}` : `verificar-4-17-0-escenas-acto3: ${n} comprobaciones OK (${totalCaminos} caminos, ${totalCorridas} corridas, ${MUTACIONES.length} mutaciones atrapadas)`);
process.exit(fallas ? 1 : 0);
