// 4.25.1 (A): ayuda para auditar y probar el director de escenas con la GENTE DE VERDAD (gente.js y gente-cuerpo.js, en una VM sin DOM, como
// verificar-3-7-2-cabezas.mjs), el terreno de verdad (altura y agua) y el `escenas-mundo.js` de verdad. Todo sale de `A4251_SRC` (una copia de
// src/ con una mutación) o, por defecto, de src/.
//
// `crearBanco(opc)` arma el mundo una vez; `correr(escena, opc)` dispara una escena, la juega con un jugador de mentira (avanza los diálogos, elige
// al azar, salta cuando se le dice) y devuelve lo que pasó con cada persona.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SRC = process.env.A4251_SRC || path.join(raiz, 'src');
export const imp = (f) => import(pathToFileURL(path.join(SRC, f)).href);

export function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

// ---------------------------------------------------------------- gente.js de verdad en una VM
function cargarGente() {
  const idModulo = (f) => '__mod_' + path.basename(f, '.js').replace(/[^A-Za-z0-9_$]/g, '_');
  const normalizar = (desde, spec) => path.resolve(path.dirname(desde), spec);
  const info = new Map(), orden = [], visto = new Set();
  const visitar = (f) => {
    f = path.resolve(f);
    if (visto.has(f)) return;
    visto.add(f);
    const texto = fs.readFileSync(f, 'utf8');
    for (const m of texto.matchAll(/^import\s+(.+?)\s+from\s+['"](.+?)['"]\s*;\s*$/gm)) if (m[2] !== 'three') visitar(normalizar(f, m[2]));
    info.set(f, texto); orden.push(f);
  };
  visitar(path.join(SRC, 'gente.js'));
  const transformar = (f, t) => {
    const ex = [...t.matchAll(/^export\s+(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]);
    t = t.replace(/^import\s+\*\s+as\s+THREE\s+from\s+['"]three['"]\s*;\s*$/gm, '');
    t = t.replace(/^import\s+\{([^}]+)\}\s+from\s+['"](.+?)['"]\s*;\s*$/gm, (_x, n, spec) =>
      `const { ${n.split(',').map((x) => x.trim()).filter(Boolean).map((x) => x.replace(/\s+as\s+/, ': ')).join(', ')} } = ${idModulo(normalizar(f, spec))};`);
    t = t.replace(/^export\s+(?=(?:const|let|var|function|class)\b)/gm, '');
    return `const ${idModulo(f)}=(()=>{\n${t}\nreturn {${[...new Set(ex)].join(',')}};\n})();\n`;
  };
  let code = fs.readFileSync(path.join(raiz, 'three-r186-inline.js'), 'utf8') + '\n';
  for (const f of orden) code += transformar(f, info.get(f)) + '\n';
  code += '\n;globalThis.__G = __mod_gente; globalThis.__THREE = THREE;';
  const ctx = { console, Math, Date, JSON, Array, Object, Number, String, Map, Set, WeakMap, WeakSet, Float32Array, Float64Array, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, Uint8Array, Uint8ClampedArray, ArrayBuffer, DataView, Promise, Symbol, Error, TypeError, RangeError, isNaN, isFinite, parseFloat, parseInt, setTimeout, clearTimeout, performance: { now: () => 0 } };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(code, ctx, { filename: 'gente-vm.js' });
  return { THREE: ctx.__THREE, G: ctx.__G };
}

const falso = () => new Proxy(function () {}, {
  get(_t, k) {
    if (k === 'classList') return { add() {}, remove() {}, toggle() {}, contains() { return false; } };
    if (k === 'style' || k === 'dataset') return {};
    if (k === 'children') return [];
    if (k === Symbol.iterator) return undefined;
    return () => falso();
  },
  set() { return true; },
});
const doc = { head: falso(), body: falso(), createElement: () => falso(), pointerLockElement: null, getElementById: () => null, querySelector: () => null };

// un hash para poner cada lugar con nombre que el mundo de mentira no conoce
const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h; };

export async function crearBanco(opc = {}) {
  const { THREE, G } = cargarGente();
  const { generarTerreno } = await imp('terreno.js');
  const { ESC, ES, LISTA_LUGARES } = await import('./ayuda-4-18-4-historia.mjs');
  const EM = await imp('escenas-mundo.js');
  const T = generarTerreno();
  const refugio = T.lugares.refugio;
  // los lugares con nombre que el terreno no trae: sobre tierra firme, a 40 a 260 m del refugio, siempre los mismos
  const puntos = {};
  const enTierra = (x, z) => !T.agua(x, z) && Math.abs(x) < 450 && Math.abs(z) < 450;
  for (const k of new Set([...LISTA_LUGARES, 'estacion', 'aldea', 'plaza', 'casa-te', 'molino', 'galpon', 'faro', 'puesto', 'refugio-puerta', 'sendero', 'coihue', 'molino-viejo', 'raiz-ramon', 'cantera', 'galpon-noche', 'galpon-propio', 'galpon-cartel', 'galpon-afuera', 'puesto-paso', 'predio'])) {
    if (Object.hasOwn(T.lugares, k) && Number.isFinite(T.lugares[k].x)) { puntos[k] = { x: T.lugares[k].x, z: T.lugares[k].z }; continue; }
    if (k === 'refugio-puerta') { puntos[k] = { x: refugio.x, z: refugio.z + 3.4 }; continue; }
    let h = hash(k), x, z, i = 0;
    do { const a = (h % 6283) / 1000, d = 40 + ((h >>> 8) % 220); x = refugio.x + Math.sin(a) * d; z = refugio.z + Math.cos(a) * d; h = Math.imul(h, 1103515245) + 12345 >>> 0; i++; } while (!enTierra(x, z) && i < 50);
    puntos[k] = { x, z };
  }
  puntos.estacion.ang = 0.3;
  const aT = { ...T, lugares: { ...T.lugares, ...puntos } };
  // obstáculos: unos cuantos troncos y una pared, para que el choque (`col.resolver`) haga algo
  const col = { resolver() {}, plataformaEn: () => null };
  const escena = new THREE.Scene();
  const sistema = G.crearGente(aT, escena, col, {}, {});
  const js = { pos: new THREE.Vector3(refugio.x + 5, 0, refugio.z + 5), yaw: 0, pitch: 0 };
  js.pos.y = T.altura(js.pos.x, js.pos.z);
  const camara = new THREE.PerspectiveCamera();
  camara.position.set(js.pos.x, js.pos.y + 1.6, js.pos.z);
  const progreso = { dia: 3, horas: 12, historia: { escenas: { vistas: {}, elecciones: {} } } };
  const clima = { estado: { objetivo: 'despejado', proximo: 'despejado', t: 0 } };
  const jugador = { estado: { pos: js.pos, yaw: 0, pitch: 0, zoom: false }, soltar() {} };
  const claves = new Set(['ramon', 'nicanor', 'ema', 'ercilia', 'guarda', 'graciela', 'fermin', 'abuela', 'panadera', 'nelida', 'jefe', 'tobias', 'belisario', 'tito', 'josefina', 'sofia', 'herrero', 'carpintero', 'tejedora']);
  for (const e of Object.values(ESC)) for (const q of Object.values(e.personajes || {})) if (q?.clave) claves.add(q.clave);
  const pareja = 'panadera';
  const armarNuevo = (k) => {
    const pos = { x: refugio.x + 20 + (hash(k) % 30), z: refugio.z + 20 + (hash(k) % 17) };
    return sistema.agregarPoblador({ clave: k, nombre: k, pos, camino: [], velocidad: 0.9, colores: {} });
  };
  const hechas = new Map(sistema.gente.map((n) => [n.clave, n]));
  for (const k of claves) if (!hechas.has(k)) hechas.set(k, armarNuevo(k));
  const lista = () => sistema.gente;
  const ctx = {
    doc, camara, progreso: () => progreso, jugador: () => jugador, modo: () => 'jugando', ajustes: () => ({ fov: 70 }), T: aT, col, alturaDePie: (Tt, c, x, z) => Tt.altura(x, z),
    gente: () => sistema, clima: () => clima, sonido: { campana() {}, portazo() {}, bisagra() {}, anotar() {}, juntar() {} }, nota() {}, fallo(e, donde) { fallos.push(`${donde}: ${e?.message || e}`); },
    puntos: () => puntos, parejaClave: () => pareja, armarYa: (k) => lista().find((n) => n.clave === k) || null,
    puedeEmpezar: () => true,
  };
  const fallos = [];
  const m = EM.crearEscenasMundo(ctx);
  // los efectos y las condiciones: todos de mentira (los efectos no hacen nada; cada condición contesta según el azar de la corrida)
  let azarCond = rng(1);
  const nombresEf = new Set(), nombresCond = new Set();
  for (const e of Object.values(ESC)) {
    for (const p of e.pasos) {
      const rec = (q) => { if (!q) return; if (q.si?.cond) nombresCond.add(q.si.cond); if (q.tipo === 'efecto') nombresEf.add(q.nombre); if (q.tipo === 'eleccion') for (const o of q.opciones) { if (o.efecto) nombresEf.add(o.efecto); } if (q.tipo === 'fundido' && Array.isArray(q.alMedio)) q.alMedio.forEach(rec); };
      rec(p);
    }
  }
  for (const n of nombresEf) m.registrarEfecto(n, () => {});
  for (const n of nombresCond) m.registrarCondicion(n, () => azarCond() < 0.5);
  const registradas = [];
  for (const e of Object.values(ESC)) { const r = m.registrar(e); if (!r.ok) registradas.push(`${e.id}: ${r.errores.join('; ')}`); }
  return { THREE, G, T: aT, sistema, EM: m, js, jugador, camara, progreso, clima, ESC, ES, puntos, refugio, fallos, registradas, claves: [...claves], lista, ponerAzarCond: (f) => { azarCond = f; } };
}

// ---------------------------------------------------------------- una escena, de principio a fin
export const CLAVES_ESTADO = ['conVos', 'enCita', 'pose', 'asiento', 'soloCerca', 'dormido', 'charlaVecinos', 'sinFrenar', 'camino', 'velocidad', 'miraFinal', '__quietud', 'alAmor', 'aBordo', 'enViaje', 'enEscena'];
const POSES_AL_AZAR = [null, null, null, 'sentado', 'mirar', 'martillar', 'tocar', 'dormir'];

// Pone a cada persona en un estado de partida al azar: cerca o lejos, dormida, con la rutina en cualquier punto, sentada, con un camino a medias…
export function sortearGente(b, azar, o = {}) {
  const { refugio } = b;
  for (const n of b.lista()) {
    const lejos = azar() < 0.35;
    const d = lejos ? 60 + azar() * 380 : 2 + azar() * 40, a = azar() * 6.283;
    let x = refugio.x + Math.sin(a) * d, z = refugio.z + Math.cos(a) * d;
    for (let i = 0; i < 20 && b.T.agua(x, z); i++) { x = refugio.x + (azar() - 0.5) * 80; z = refugio.z + (azar() - 0.5) * 80; }
    n.pos.set(x, b.T.altura(x, z), z);
    n.g.position.copy(n.pos);
    for (const k of CLAVES_ESTADO) delete n[k];
    n.vel = 0; n.espera = azar() < 0.5 ? azar() * 40 : 0; n.etapa = Math.floor(azar() * 3);
    if (n.ruta) { n.camino = undefined; } else { n.camino = azar() < 0.4 ? [{ x: x + 10, z: z + 5, cerca: 0.5 }] : []; }
    n.dormido = azar() < 0.2;
    n.soloCerca = azar() < 0.15 ? 25 : 0;
    n.pose = POSES_AL_AZAR[Math.floor(azar() * POSES_AL_AZAR.length)];
    if (n.pose === 'sentado') n.asiento = 0.47;
    if (n.clave === 'guarda') { n.aBordo = azar() < 0.7; n.enViaje = false; }
    if (azar() < 0.1) { n.conVos = true; n.enCita = true; }
    n.g.visible = !n.dormido;
    delete n.miraFinal; delete n.__quietud;
  }
  b.js.pos.set(refugio.x + (azar() - 0.5) * 30, b.T.altura(refugio.x, refugio.z), refugio.z + (azar() - 0.5) * 30);
}
const copia = (n) => { const r = {}; for (const k of CLAVES_ESTADO) r[k] = { tiene: Object.hasOwn(n, k), v: Array.isArray(n[k]) ? n[k].map((q) => ({ ...q })) : n[k] }; r.x = n.pos.x; r.z = n.pos.z; return r; };
const igual = (a, b) => (Array.isArray(a) || Array.isArray(b) ? JSON.stringify(a) === JSON.stringify(b) : a === b);

// Juega la escena. o: { semilla, saltarEn (s), tope (s), paso }. Devuelve { termino, t, caminatas, forzadas, diferencias, tareaFuera, fallos, ... }
export function correrEscena(b, id, o = {}) {
  const azar = rng(o.semilla || 1), dt = o.dt || 1 / 30, tope = o.tope || 900;
  b.ponerAzarCond(rng((o.semilla || 1) * 7 + 3));
  sortearGente(b, azar, o);
  b.progreso.historia = { escenas: { vistas: {}, elecciones: {} } };
  b.progreso.horas = o.hora ?? (6 + azar() * 16);
  b.fallos.length = 0;
  const antes = new Map();   // el estado de cada uno justo antes de que la escena lo capture
  const tocados = new Set();
  const M = b.EM.mundo;
  const orig = { caminar: M.caminar, teletransportar: M.teletransportar, capturar: M.capturar };
  const caminatas = [], forzadas = [];
  let t = 0;
  M.capturar = (k) => { tocados.add(k); const n = b.lista().find((q) => q.clave === (k === 'pareja' ? 'panadera' : k)); if (n && !antes.has(n.clave)) antes.set(n.clave, copia(n)); return orig.capturar(k); };
  M.caminar = (k, d, op) => { const n = b.lista().find((q) => q.clave === (k === 'pareja' ? 'panadera' : k)); caminatas.push({ k, d: { ...d }, t0: t, dist0: n ? Math.hypot(n.pos.x - d.x, n.pos.z - d.z) : 0, fin: null }); return orig.caminar(k, d, op); };
  M.teletransportar = (k, p, mira) => {
    const s = b.EM.director.__sesion?.();
    const n = b.lista().find((q) => q.clave === (k === 'pareja' ? 'panadera' : k));
    if (s && !s.saltando && s.fase === 'corriendo' && n) forzadas.push({ k, t, resta: Math.hypot(n.pos.x - p.x, n.pos.z - p.z), enAgua: b.T.agua(p.x, p.z) });
    return orig.teletransportar(k, p, mira);
  };
  let ok = b.EM.disparar(id, { forzar: true });
  let tEspera = 0, saltos = 0;
  const poseAntes = new Map();
  if (ok) {
    while (b.EM.activa() && t < tope) {
      t += dt;
      b.EM.actualizar(dt);
      b.sistema.actualizar(dt, b.js, b.camara, null, 0);
      b.EM.despuesDeGente(dt);
      for (const c of caminatas) if (c.fin === null) { const sesion = b.EM.director.__sesion?.(); const n = b.lista().find((q) => q.clave === (c.k === 'pareja' ? 'panadera' : c.k)); if (n && Math.hypot(n.pos.x - c.d.x, n.pos.z - c.d.z) < 0.6) c.fin = t - c.t0; }
      const dat = b.EM.director.datos();
      if (dat) {
        if ((dat.dialogo && dat.dialogo.completo) || dat.eleccion) { tEspera += dt; if (tEspera > 0.3 + azar() * 0.4) { tEspera = 0; if (dat.eleccion) { if (b.EM.director.eleccionLista()) b.EM.director.elegir(Math.floor(azar() * dat.eleccion.opciones.length)); } else b.EM.director.avanzar(); } } else tEspera = 0;
      }
      if (o.saltarEn !== undefined && t >= o.saltarEn && saltos < 2 && b.EM.corriendo()) { b.EM.director.pedirSaltar(); saltos++; }
    }
  }
  const termino = ok && !b.EM.activa();
  const tFin = t;
  // un rato más con la gente andando sola (la rutina tiene que seguir)
  if (termino) for (let i = 0; i < Math.round(2 / dt); i++) b.sistema.actualizar(dt, b.js, b.camara, null, 0);
  Object.assign(M, orig);
  const despues = new Map(b.lista().map((n) => [n.clave, copia(n)]));
  const diferencias = [];
  for (const [k, a] of antes) {
    if (!tocados.has(k) && !(k === 'panadera' && tocados.has('pareja'))) continue;
    const d = despues.get(k);
    for (const c of CLAVES_ESTADO) {
      const va = a[c].tiene ? a[c].v : undefined, vd = d[c].tiene ? d[c].v : undefined;
      if (!igual(va, vd)) diferencias.push({ k, c, antes: va, despues: vd });
    }
  }
  // lo que quedó haciendo la tarea de la rutina lejos de su lugar
  const tareaFuera = [];
  for (const n of b.lista()) {
    if (!tocados.has(n.clave) && !(n.clave === 'panadera' && tocados.has('pareja'))) continue;
    if (n.ruta && n.espera > 0) { const e = n.ruta[n.etapa % n.ruta.length]; const dd = Math.hypot(n.pos.x - e.x, n.pos.z - e.z); if (dd > 2) tareaFuera.push({ k: n.clave, espera: Math.round(n.espera), lejos: Math.round(dd) }); }
  }
  return { id, ok, termino, t: tFin, tocados: [...tocados], caminatas: caminatas.map((c) => ({ k: c.k, dist0: Math.round(c.dist0), fin: c.fin === null ? null : Math.round(c.fin * 10) / 10 })), forzadas, diferencias, tareaFuera, fallos: [...b.fallos], nanPos: b.lista().filter((n) => !Number.isFinite(n.pos.x + n.pos.y + n.pos.z)).map((n) => n.clave), enEscenaPegada: b.lista().filter((n) => n.enEscena).map((n) => n.clave), quietudPegada: b.lista().filter((n) => n.__quietud).map((n) => n.clave) };
}
