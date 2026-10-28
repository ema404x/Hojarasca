// 4.14.0: el director de escenas de la Historia. Módulo PURO (sin DOM ni three; se prueba en Node). Una escena es DATOS: un guion de
// pasos (plano, dialogo, gesto, espera, sonido, hora, clima, eleccion, efecto, fundido, salto). Este módulo las valida, las corre
// paso a paso, resuelve la cámara dirigida y lleva el estado de «vistas»; todo lo que toca el juego (mover a un personaje, la hora, el
// sonido, la cámara de verdad) pasa por el `mundo` que le da `escenas-mundo.js` (en las pruebas, uno de mentira). La API y el
// formato de las escenas están documentados en CAMBIOS_4_14_0.md.
//
// Garantías:
//  · cancelable: `saltar()` recorre lo que falta aplicando los efectos en orden y deja a cada personaje en su lugar final: nunca queda
//    el mundo a medias;
//  · la cámara vuelve al jugador interpolando (fase «saliendo»);
//  · una escena sólo se marca vista al terminar (o al saltarla): guardar a mitad de una escena la deja pendiente (`paraGuardar`).

const PI = Math.PI;
const num = (v, d = 0) => (Number.isFinite(Number(v)) && v !== null && v !== '' && typeof v !== 'boolean' ? Number(v) : d);
const acotar = (v, a, b) => Math.max(a, Math.min(b, v));
const objeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const lerp = (a, b, u) => a + (b - a) * u;
const difAng = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
const lerpAng = (a, b, u) => a + difAng(a, b) * u;

export const SUAVES = {
  lineal: (u) => u,
  suave: (u) => u * u * (3 - 2 * u),
  entra: (u) => u * u,
  sale: (u) => 1 - (1 - u) * (1 - u),
};
const suavizar = (nombre, u) => (SUAVES[nombre] || SUAVES.suave)(acotar(u, 0, 1));

export const TIPOS_PASO = ['plano', 'dialogo', 'gesto', 'espera', 'sonido', 'hora', 'clima', 'eleccion', 'efecto', 'fundido', 'salto'];
export const TIPOS_PLANO = ['general', 'medio', 'primer', 'detalle', 'hombro', 'picado', 'contrapicado', 'paneo', 'travelling', 'empuje', 'fijo', 'libre'];
export const ACCIONES_GESTO = ['caminar', 'mirar', 'posar', 'aparecer', 'desaparecer'];
// las poses que sabe hacer escenas-mundo.js: las del juego (gente.js, `g.pose`), las de quietud (gente-cuerpo.js) y las de escena
export const POSES_ESCENA = ['saludo', 'senalar', 'asentir', 'negar', 'encoger', 'pensar', 'cruzados', 'cintura', 'barba', 'gorro', 'atras', 'delantal', 'juntas',
  'mirar', 'aplaudir', 'contar', 'brindar', 'tocar', 'palear', 'hachar', 'regar', 'martillar', 'serruchar', 'bailar'];
export const MIN_OPCIONES = 2;
export const MAX_OPCIONES = 4;
export const SALIDA_CAMARA = 1.0;   // segundos que tarda la cámara en volver al jugador
export const ENTRADA_CAMARA = 1.2;  // y en irse al primer plano
export const CPS = 42;              // letras por segundo del texto
export const ACELERADO = 6;         // cuánto más rápido escribe con la tecla apretada
export const CONFIRMAR_SALTO = 2.6; // segundos que vale el «Esc otra vez para saltar»
const TOPE_PASOS = 4000;            // por si una escena con saltos hacia atrás no termina nunca

// Nombres y colores de los personajes del valle (la escena puede pisarlos en `personajes`)
export const PERSONAJES_BASE = {
  jugador: { nombre: 'Vos', color: '#f2e7c9', clave: null },
  ramon: { nombre: 'Don Ramón', color: '#c9a36a', clave: 'ramon' },
  nicanor: { nombre: 'Nicanor', color: '#7fb4c9', clave: 'nicanor' },
  josefina: { nombre: 'Josefina', color: '#a8c97a', clave: 'ema' },
  ema: { nombre: 'Josefina', color: '#a8c97a', clave: 'ema' },
  ercilia: { nombre: 'Ercilia', color: '#d98f6a', clave: 'ercilia' },
  elsa: { nombre: 'Elsa', color: '#9aa6d9', clave: 'guarda' },
  guarda: { nombre: 'Elsa', color: '#9aa6d9', clave: 'guarda' },
  // 4.15.0: las personas nuevas de la Historia (Graciela, la ingeniera del ramal; Fermín, el pastor del galpón de esquila)
  graciela: { nombre: 'Graciela', color: '#b9b2a0', clave: 'graciela' },
  fermin: { nombre: 'Fermín', color: '#c9a07a', clave: 'fermin' },
};

// ---------------------------------------------------------------- lo guardado (progreso.historia.escenas)
const ID_OK = /^[a-z0-9][a-z0-9_.-]{0,63}$/i;
const PROHIBIDOS = new Set(['__proto__', 'constructor', 'prototype']);
export const idValido = (s) => typeof s === 'string' && ID_OK.test(s) && !PROHIBIDOS.has(s);
export const MAX_ESCENAS_GUARDADAS = 600;
export function escenasNuevas() { return { vistas: {}, elecciones: {} }; }
export function sanearEscenas(v) {
  const e = escenasNuevas();
  if (!objeto(v)) return e;
  let n = 0;
  if (objeto(v.vistas)) for (const [k, d] of Object.entries(v.vistas)) { if (n >= MAX_ESCENAS_GUARDADAS) break; if (idValido(k)) { e.vistas[k] = acotar(Math.floor(num(d, 1)), 1, 1e6); n++; } }
  if (objeto(v.elecciones)) {
    let m = 0;
    for (const [k, o] of Object.entries(v.elecciones)) {
      if (m >= MAX_ESCENAS_GUARDADAS) break;
      if (!idValido(k) || !objeto(o)) continue;
      const r = {};
      let c = 0;
      for (const [q, val] of Object.entries(o)) { if (c >= 40) break; if (idValido(q) && idValido(val)) { r[q] = val; c++; } }
      e.elecciones[k] = r; m++;
    }
  }
  return e;
}
// La parte de escenas de una historia (la crea si falta: una partida vieja no la tiene). `h` es progreso.historia
export function escenasDe(h) {
  if (!objeto(h)) return escenasNuevas();
  if (!objeto(h.escenas) || !objeto(h.escenas.vistas) || !objeto(h.escenas.elecciones)) h.escenas = sanearEscenas(h.escenas);
  return h.escenas;
}
export const escenaVista = (h, id) => Object.hasOwn(escenasDe(h).vistas, id);
export function marcarVista(h, id, dia = 1) {
  if (!idValido(id)) return false;
  escenasDe(h).vistas[id] = acotar(Math.floor(num(dia, 1)), 1, 1e6);
  return true;
}
export function eleccionDe(h, escenaId, eleccionId) {
  const e = escenasDe(h);
  const o = Object.hasOwn(e.elecciones, escenaId) ? e.elecciones[escenaId] : null;
  return o && Object.hasOwn(o, eleccionId) ? o[eleccionId] : null;
}

// ---------------------------------------------------------------- validar una escena
// Devuelve { ok, errores: [texto] }. Nunca tira.
export function validarEscena(e) {
  const err = [];
  if (!objeto(e)) return { ok: false, errores: ['la escena no es un objeto'] };
  if (!idValido(e.id)) err.push('id inválido (letras, números, guion; hasta 64)');
  if (!Array.isArray(e.pasos) || !e.pasos.length) { err.push('sin pasos'); return { ok: false, errores: err }; }
  const etq = new Set();
  e.pasos.forEach((p) => { if (objeto(p) && typeof p.etiqueta === 'string') etq.add(p.etiqueta); });
  const ref = (r) => typeof r === 'string' ? r.length > 0 && !PROHIBIDOS.has(r) : objeto(r) && (Number.isFinite(Number(r.x)) || typeof r.ref === 'string' || typeof r.lugar === 'string' || typeof r.frente === 'string');
  const efectoOk = (x) => typeof x === 'string' && x.length > 0;
  e.pasos.forEach((p, i) => {
    const w = `paso ${i + 1}`;
    if (!objeto(p) || !TIPOS_PASO.includes(p.tipo)) { err.push(`${w}: tipo desconocido`); return; }
    if (p.si !== undefined && !(objeto(p.si) && (typeof p.si.eleccion === 'string' || typeof p.si.cond === 'string' || typeof p.si.vista === 'string'))) err.push(`${w}: «si» mal armado`);
    switch (p.tipo) {
      case 'plano':
        if (!TIPOS_PLANO.includes(p.plano)) err.push(`${w}: plano «${p.plano}» desconocido`);
        else if (p.plano !== 'libre' && !ref(p.a)) err.push(`${w}: el plano necesita «a»`);
        else if ((p.plano === 'paneo') && !ref(p.hasta)) err.push(`${w}: el paneo necesita «hasta»`);
        else if (p.plano === 'libre' && !(objeto(p.pos) && objeto(p.mira))) err.push(`${w}: el plano libre necesita «pos» y «mira»`);
        break;
      case 'dialogo': {
        const ls = Array.isArray(p.lineas) ? p.lineas : (typeof p.texto === 'string' ? [p.texto] : []);
        if (!ls.length) err.push(`${w}: diálogo sin líneas`);
        ls.forEach((l) => { if (!(typeof l === 'string' ? l.trim() : (objeto(l) && typeof l.texto === 'string' && l.texto.trim()))) err.push(`${w}: línea vacía`); });
        break;
      }
      case 'gesto':
        if (typeof p.quien !== 'string' || !p.quien) err.push(`${w}: gesto sin «quien»`);
        if (!ACCIONES_GESTO.includes(p.accion)) err.push(`${w}: acción «${p.accion}» desconocida`);
        else if ((p.accion === 'caminar' || p.accion === 'aparecer') && !ref(p.a)) err.push(`${w}: «${p.accion}» necesita «a»`);
        else if (p.accion === 'mirar' && !ref(p.a)) err.push(`${w}: «mirar» necesita «a»`);
        else if (p.accion === 'posar' && typeof p.pose !== 'string') err.push(`${w}: «posar» necesita «pose»`);
        break;
      case 'espera':
        if (!(Number.isFinite(Number(p.dur)) || Number.isFinite(Number(p.hastaHora)))) err.push(`${w}: espera sin «dur» ni «hastaHora»`);
        break;
      case 'sonido': if (typeof p.id !== 'string') err.push(`${w}: sonido sin «id»`); break;
      case 'hora': if (!Number.isFinite(Number(p.a)) && !Number.isFinite(Number(p.mas))) err.push(`${w}: hora sin «a» ni «mas»`); break;
      case 'clima': if (typeof p.estado !== 'string') err.push(`${w}: clima sin «estado»`); break;
      case 'eleccion': {
        const o = p.opciones;
        if (!idValido(p.id)) err.push(`${w}: elección sin «id» válido`);
        if (!Array.isArray(o) || o.length < MIN_OPCIONES || o.length > MAX_OPCIONES) { err.push(`${w}: la elección lleva de ${MIN_OPCIONES} a ${MAX_OPCIONES} opciones`); break; }
        const vistos = new Set();
        o.forEach((x) => {
          if (!objeto(x) || !idValido(x.id) || typeof x.texto !== 'string' || !x.texto.trim()) err.push(`${w}: opción mal armada`);
          else { if (vistos.has(x.id)) err.push(`${w}: opción repetida «${x.id}»`); vistos.add(x.id); if (x.a !== undefined && !etq.has(x.a)) err.push(`${w}: la opción «${x.id}» salta a una etiqueta que no existe`); }
          if (objeto(x) && x.efecto !== undefined && !efectoOk(x.efecto)) err.push(`${w}: efecto de opción mal armado`);
        });
        break;
      }
      case 'efecto': if (!efectoOk(p.nombre)) err.push(`${w}: efecto sin «nombre»`); break;
      case 'fundido': if (!['negro', 'claro', 'cruzado'].includes(p.a)) err.push(`${w}: fundido «a» negro, claro o cruzado`); break;
      case 'salto': if (!etq.has(p.a)) err.push(`${w}: salto a una etiqueta que no existe`); break;
      default: break;
    }
  });
  return { ok: !err.length, errores: err };
}

// ---------------------------------------------------------------- referencias y cámara
// Una referencia a un lugar del mundo: 'jugador' | un personaje | { x, z, y? } | { ref, dx, dy, dz } | { lugar } | { frente, dist, lado }.
// `mundo.posicion(ref)` resuelve lo que depende del juego (personajes, lugares, el frente del jugador); acá se suman los corrimientos.
export function resolverRef(ref, mundo) {
  if (ref === undefined || ref === null) return null;
  let p = null;
  if (objeto(ref) && Number.isFinite(Number(ref.x)) && Number.isFinite(Number(ref.z)) && ref.ref === undefined) {
    p = { x: Number(ref.x), z: Number(ref.z), y: Number.isFinite(Number(ref.y)) ? Number(ref.y) : undefined };
  } else if (objeto(ref) && typeof ref.ref === 'string') {
    const b = resolverRef(ref.ref, mundo);
    if (!b) return null;
    p = { x: b.x + num(ref.dx), z: b.z + num(ref.dz), y: Number.isFinite(b.y) ? b.y + num(ref.dy) : (Number.isFinite(Number(ref.dy)) ? Number(ref.dy) : undefined) };
  } else {
    const r = mundo.posicion ? mundo.posicion(ref) : null;
    if (!r || !Number.isFinite(r.x) || !Number.isFinite(r.z)) return null;
    p = { x: r.x, z: r.z, y: Number.isFinite(r.y) ? r.y : undefined };
  }
  if (!Number.isFinite(p.y)) p.y = mundo.suelo ? num(mundo.suelo(p.x, p.z)) : 0;
  return p;
}

export function poseMirando(pos, mira, fov = 60) {
  const dx = mira.x - pos.x, dy = mira.y - pos.y, dz = mira.z - pos.z;
  return { x: pos.x, y: pos.y, z: pos.z, yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(dy, Math.hypot(dx, dz)), fov };
}
export function mezclarPoses(a, b, u) {
  return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: lerp(a.z, b.z, u), yaw: lerpAng(a.yaw, b.yaw, u), pitch: lerp(a.pitch, b.pitch, u), fov: lerp(a.fov, b.fov, u) };
}
const poseValida = (p) => !!p && ['x', 'y', 'z', 'yaw', 'pitch', 'fov'].every((k) => Number.isFinite(p[k]));

const ENCUADRES = {
  general: { dist: 11, alto: 3.2, miraY: 1.2, fov: 60 },
  medio: { dist: 3.4, alto: 1.55, miraY: 1.4, fov: 55 },
  primer: { dist: 1.35, alto: 1.6, miraY: 1.58, fov: 42 },
  detalle: { dist: 0.85, alto: 1.05, miraY: 0.9, fov: 40 },
  picado: { dist: 3.2, alto: 6.5, miraY: 0.4, fov: 58 },
  contrapicado: { dist: 3.6, alto: 0.3, miraY: 1.9, fov: 62 },
};
const DEG = PI / 180;

// El plano compilado: una función `pose(u, ctx)` (u de 0 a 1 en la duración del plano) que se evalúa cada cuadro, así sigue a un personaje
// que camina. `ctx`: { mundo, base } con `base` la pose de la cámara del jugador al empezar la escena. Devuelve null si falta una referencia.
export function compilarPlano(p, ctx) {
  const tipo = p.plano;
  const R = (r) => resolverRef(r, ctx.mundo);
  const dir = (A) => { // hacia dónde queda el espectador visto desde A: `desde` si lo hay; si no, la cámara del jugador al empezar
    const d = p.desde !== undefined ? R(p.desde) : (ctx.base ? { x: ctx.base.x, z: ctx.base.z } : null);
    if (!d) return 0;
    return Math.atan2(d.x - A.x, d.z - A.z);
  };
  const def = ENCUADRES[tipo === 'fijo' || tipo === 'empuje' || tipo === 'travelling' ? (p.encuadre && ENCUADRES[p.encuadre] ? p.encuadre : tipo === 'empuje' ? 'medio' : 'general') : tipo] || ENCUADRES.general;
  const dist0 = num(p.dist, def.dist), alto = num(p.alto, def.alto), miraY = num(p.miraY, def.miraY), fov = num(p.fov, def.fov);
  const giro = num(p.giro) * DEG, lado = num(p.lado, 1);
  const desde = (A, az, dist, yBase = A.y) => ({ x: A.x + Math.sin(az) * dist, y: yBase + alto, z: A.z + Math.cos(az) * dist });
  let f = null;
  if (tipo === 'libre') {
    f = (u) => {
      const a = R(p.pos), m = R(p.mira);
      if (!a || !m) return null;
      const a2 = p.posFin ? R(p.posFin) : a, m2 = p.miraFin ? R(p.miraFin) : m;
      if (!a2 || !m2) return null;
      return poseMirando({ x: lerp(a.x, a2.x, u), y: lerp(a.y + num(p.pos.dy), a2.y + num(p.posFin?.dy), u), z: lerp(a.z, a2.z, u) }, { x: lerp(m.x, m2.x, u), y: lerp(m.y, m2.y, u), z: lerp(m.z, m2.z, u) }, fov);
    };
  } else if (tipo === 'hombro') {
    f = () => {
      const S = R(p.desde !== undefined ? p.desde : 'jugador'), A = R(p.a);
      if (!S || !A) return null;
      let dx = A.x - S.x, dz = A.z - S.z;
      const d = Math.hypot(dx, dz) || 1; dx /= d; dz /= d;
      const px = -dz * lado, pz = dx * lado;   // el costado
      const atras = num(p.atras, 0.55), costado = num(p.costado, 0.4);
      const pos = { x: S.x - dx * atras + px * costado, y: S.y + num(p.alto, 1.68), z: S.z - dz * atras + pz * costado };
      return poseMirando(pos, { x: A.x, y: A.y + num(p.miraY, 1.5), z: A.z }, num(p.fov, 52));
    };
  } else if (tipo === 'paneo') {
    f = (u) => {
      const A = R(p.a), B = R(p.hasta);
      if (!A || !B) return null;
      let pos;
      if (p.camara !== undefined) { const c = R(p.camara); if (!c) return null; pos = { x: c.x, y: c.y + num(p.alto, 0), z: c.z }; }
      else {
        const mx = (A.x + B.x) / 2, mz = (A.z + B.z) / 2, largo = Math.hypot(B.x - A.x, B.z - A.z);
        const d = num(p.dist, Math.max(6, largo * 0.9));
        const az = Math.atan2(mx - (ctx.base ? ctx.base.x : mx), mz - (ctx.base ? ctx.base.z : mz)) + giro;   // del lado del jugador
        const px = Math.sin(az), pz = Math.cos(az);
        // perpendicular al segmento, del lado de donde viene el jugador
        let nx = -(B.z - A.z), nz = B.x - A.x; const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl;
        const sgn = (nx * -px + nz * -pz) >= 0 ? 1 : -1;
        pos = { x: mx + nx * sgn * d, y: Math.max(A.y, B.y) + num(p.alto, 2.0), z: mz + nz * sgn * d };
      }
      return poseMirando(pos, { x: lerp(A.x, B.x, u), y: lerp(A.y, B.y, u) + miraY * (p.miraY === undefined ? 0.85 : 1), z: lerp(A.z, B.z, u) }, num(p.fov, 55));
    };
  } else if (tipo === 'travelling') {
    f = (u) => {
      const A = R(p.a);
      if (!A) return null;
      const az = (p.angulo !== undefined ? num(p.angulo) * DEG : dir(A) + PI / 2 * lado) + giro;
      const dist = num(p.dist, 4.2);
      const B = p.hasta !== undefined ? R(p.hasta) : null;
      const T = B ? { x: lerp(A.x, B.x, u), y: lerp(A.y, B.y, u), z: lerp(A.z, B.z, u) } : A;
      const c = { x: T.x + Math.sin(az) * dist, y: T.y + num(p.alto, 1.6), z: T.z + Math.cos(az) * dist };
      return poseMirando(c, { x: T.x, y: T.y + num(p.miraY, 1.4), z: T.z }, num(p.fov, 55));
    };
  } else {
    // general, medio, primer, detalle, picado, contrapicado, empuje, fijo
    f = (u) => {
      const A = R(p.a);
      if (!A) return null;
      const az = (p.angulo !== undefined ? num(p.angulo) * DEG : dir(A)) + giro;
      const dist = tipo === 'empuje' ? lerp(dist0, num(p.distFin, dist0 * 0.45), u) : dist0;
      const c = desde(A, az, dist);
      return poseMirando(c, { x: A.x, y: A.y + miraY, z: A.z }, tipo === 'empuje' ? lerp(fov, num(p.fovFin, fov), u) : fov);
    };
  }
  return f;
}

// La mirada dirigida corta (2 a 3 s en pleno juego): la cámara del jugador gira sola hacia un punto y vuelve, sin sacarle el movimiento.
// Puro: `iniciar(origen, objetivo, dur)` y `paso(dt)` → { yaw, pitch } o null cuando terminó.
export function crearMirada() {
  let m = null;
  return {
    iniciar(origen, objetivo, dur = 2.6) {
      if (!poseValida({ ...origen, fov: 1 }) && !(Number.isFinite(origen?.yaw) && Number.isFinite(origen?.pitch))) return false;
      if (!(Number.isFinite(objetivo?.yaw) && Number.isFinite(objetivo?.pitch))) return false;
      m = { o: { yaw: origen.yaw, pitch: origen.pitch }, d: { yaw: objetivo.yaw, pitch: objetivo.pitch }, t: 0, dur: Math.max(0.6, num(dur, 2.6)) };
      return true;
    },
    activa: () => !!m,
    // sube 25 %, se queda mirando, baja 25 %
    peso(t, dur) { const u = acotar(t / dur, 0, 1); const sube = 0.28, baja = 0.72; return u < sube ? SUAVES.suave(u / sube) : u > baja ? SUAVES.suave((1 - u) / (1 - baja)) : 1; },
    paso(dt) {
      if (!m) return null;
      m.t += dt;
      if (m.t >= m.dur) { const o = { yaw: m.o.yaw, pitch: m.o.pitch, fin: true }; m = null; return o; }
      const w = this.peso(m.t, m.dur);
      return { yaw: m.o.yaw + difAng(m.o.yaw, m.d.yaw) * w, pitch: lerp(m.o.pitch, m.d.pitch, w), fin: false };
    },
    cancelar() { m = null; },
  };
}

// ---------------------------------------------------------------- el director
// opc: { mundo, efectos: {nombre: fn(args, ctx)}, condiciones: {nombre: fn(ctx) → bool}, estado: () => ({vistas, elecciones}), dia: () => n,
//        alTerminar: (resultado) => void, alError: (texto) => void }
export function crearDirector(opc = {}) {
  const mundo = opc.mundo || {};
  const efectos = { ...(opc.efectos || {}) };
  const condiciones = { ...(opc.condiciones || {}) };
  const catalogo = new Map();
  let propio = escenasNuevas();
  const estadoGuardado = () => { const e = opc.estado ? opc.estado() : propio; return e; };
  const dia = () => Math.max(1, Math.floor(num(opc.dia ? opc.dia() : 1, 1)));
  const alError = (t) => { try { opc.alError?.(t); } catch { /* el aviso de un error nunca frena */ } };
  let s = null;   // la sesión en curso
  let reloj = 0;  // segundos del director (para el «Esc otra vez»)

  // ---- registro
  function registrar(escena) {
    const v = validarEscena(escena);
    if (!v.ok) return v;
    const etiquetas = {};
    escena.pasos.forEach((p, i) => { if (typeof p.etiqueta === 'string') etiquetas[p.etiqueta] = i; });
    catalogo.set(escena.id, { escena, etiquetas });
    return v;
  }
  function quitar(id) { return catalogo.delete(id); }
  const registrarEfecto = (nombre, fn) => { if (typeof nombre === 'string' && typeof fn === 'function') efectos[nombre] = fn; };
  const registrarCondicion = (nombre, fn) => { if (typeof nombre === 'string' && typeof fn === 'function') condiciones[nombre] = fn; };
  const hay = (id) => catalogo.has(id);
  const ids = () => [...catalogo.keys()];
  const vista = (id) => Object.hasOwn(estadoGuardado().vistas, id);
  function efectosFaltantes(id) {
    const c = catalogo.get(id);
    if (!c) return [];
    const nombres = new Set();
    for (const p of c.escena.pasos) {
      if (p.tipo === 'efecto') nombres.add(p.nombre);
      if (p.tipo === 'eleccion') for (const o of p.opciones) if (o.efecto) nombres.add(o.efecto);
      if (p.tipo === 'fundido' && Array.isArray(p.alMedio)) for (const q of p.alMedio) if (q?.tipo === 'efecto') nombres.add(q.nombre);
    }
    return [...nombres].filter((n) => typeof efectos[n] !== 'function');
  }

  // ---- condiciones («si») y disparadores
  function cumple(si, ctx = {}) {
    if (!si) return true;
    const el = estadoActual();
    if (typeof si.eleccion === 'string') {
      const v = el.elecciones[si.eleccion];
      if (si.es !== undefined) return v === si.es;
      if (Array.isArray(si.esUno)) return si.esUno.includes(v);
      if (si.no !== undefined) return v !== undefined && v !== si.no;
      return v !== undefined;
    }
    if (typeof si.vista === 'string') return si.no ? !vista(si.vista) : vista(si.vista);
    if (typeof si.cond === 'string') {
      const fn = condiciones[si.cond];
      if (typeof fn !== 'function') return false;
      try { return !!fn({ ...ctx, args: si.args, elecciones: el.elecciones }) !== (si.no === true); } catch { return false; }
    }
    return true;
  }
  // las elecciones que ya se conocen: las de esta sesión (más nuevas) sobre las guardadas de la escena
  function estadoActual() {
    const g = estadoGuardado();
    const mias = s ? s.elecciones : {};
    const todas = {};
    for (const o of Object.values(g.elecciones)) Object.assign(todas, o);
    return { elecciones: { ...todas, ...mias } };
  }
  // ¿se puede disparar ahora? `disparador` de la escena: { hora: [desde, hasta], requiere: [ids vistos], cond: 'nombre' }
  function elegible(id, ctx = {}) {
    const c = catalogo.get(id);
    if (!c || s) return false;
    const e = c.escena;
    if (!e.repetible && vista(id)) return false;
    const d = e.disparador;
    if (d) {
      if (Array.isArray(d.hora)) {
        const h = ((num(ctx.horas, num(mundo.horaActual?.(), 12)) % 24) + 24) % 24, [a, b] = d.hora.map(Number);
        if (a <= b ? !(h >= a && h < b) : !(h >= a || h < b)) return false;
      }
      if (Array.isArray(d.requiere) && !d.requiere.every((x) => vista(x))) return false;
      if (typeof d.cond === 'string' && !cumple({ cond: d.cond }, ctx)) return false;
    }
    return true;
  }
  const buscarElegible = (ctx = {}) => ids().find((id) => catalogo.get(id).escena.auto === true && elegible(id, ctx)) || null;

  // ---- disparar
  function disparar(id, o = {}) {
    const c = catalogo.get(id);
    if (!c || s) return false;
    if (!o.forzar && !c.escena.repetible && !c.escena.efimera && vista(id)) return false;
    if (mundo.puedeEmpezar && !mundo.puedeEmpezar()) return false;
    const base = mundo.camaraJugador ? mundo.camaraJugador() : null;
    s = {
      id, c, e: c.escena, idx: 0, t: 0, fase: 'corriendo', actual: null, base: poseValida(base) ? base : null,
      camara: { pose: poseValida(base) ? { ...base } : null, tiro: null, previa: null, primero: true },
      gestos: new Map(), horaMov: null, climaMov: null, fundido: { a: 0, desde: 0, hasta: 0, t: 0, dur: 0 },
      dialogo: null, eleccion: null, elecciones: {}, saltada: false, salida: null, guarda: 0, aviso: '', resumen: '',
      confirmarHasta: -1, acelerando: false, personajes: { ...PERSONAJES_BASE, ...(objeto(c.escena.personajes) ? c.escena.personajes : {}) },
      capturados: new Set(), errores: [], mw: null,
    };
    s.mw = { suelo: mundo.suelo ? (x, z) => mundo.suelo(x, z) : undefined, posicion: (r) => (mundo.posicion ? mundo.posicion(mapearRef(r)) : null) };
    for (const k of Object.keys(s.personajes)) if (!objeto(s.personajes[k])) delete s.personajes[k];
    try { mundo.alEmpezar?.({ id, escena: c.escena }); } catch (e) { alError(`alEmpezar: ${e?.message || e}`); }
    for (const f of efectosFaltantes(id)) { s.errores.push(`efecto sin registrar: ${f}`); alError(`escena ${id}: efecto sin registrar «${f}»`); }
    return true;
  }

  // ---- personajes
  function mapearRef(r) {
    const k = (x) => (typeof x === 'string' && s.personajes[x] && Object.hasOwn(s.personajes[x], 'clave') && s.personajes[x].clave ? s.personajes[x].clave : x);
    if (typeof r === 'string') return k(r);
    if (objeto(r) && typeof r.frente === 'string') return { ...r, frente: k(r.frente) };
    return r;
  }
  const clave = (q) => (s.personajes[q] && Object.hasOwn(s.personajes[q], 'clave') ? s.personajes[q].clave : q);
  const nombreDe = (q) => (s.personajes[q]?.nombre ?? (typeof q === 'string' ? q : ''));
  const colorDe = (q) => s.personajes[q]?.color || '#f2e7c9';
  function capturar(q) {
    if (!s.capturados.has(q)) { s.capturados.add(q); try { mundo.capturar?.(clave(q)); } catch (e) { alError(`capturar ${q}: ${e?.message || e}`); } }
  }

  // ---- cámara
  function iniciarPlano(p) {
    const f = compilarPlano(p, { mundo: s.mw, base: s.base });
    if (!f) return false;
    const cam = s.camara;
    const dur = Math.max(0.05, num(p.dur, 3));
    const primero = cam.primero;
    const mezcla = p.mezcla !== undefined ? Math.max(0, num(p.mezcla)) : (primero ? ENTRADA_CAMARA : 0);
    let congelada = null;
    if (p.congelar === true || p.plano === 'fijo') { const q = f(0); congelada = q; }
    cam.tiro = { f: congelada ? () => congelada : f, t: 0, dur, mezcla, suave: p.suave || 'suave', tiembla: num(p.tiembla), desde: cam.pose ? { ...cam.pose } : null, tf: (p.suave || 'suave') };
    cam.primero = false;
    tickCamara(0);
    return true;
  }
  function tickCamara(dt) {
    const cam = s.camara, tr = cam.tiro;
    if (!tr) return;
    tr.t += dt;
    const u = tr.dur > 0 ? tr.t / tr.dur : 1;
    // el plano que no es de movimiento (u casi constante) igual avanza: sólo `empuje`, `paneo`, `travelling` con `hasta` usan u
    let q = tr.f(suavizar(tr.tf, Math.min(1, u)));
    if (!q) return;   // si falta una referencia, la cámara se queda como estaba
    if (tr.desde && tr.mezcla > 0 && tr.t < tr.mezcla) q = mezclarPoses(tr.desde, q, SUAVES.suave(tr.t / tr.mezcla));
    if (tr.tiembla) { const w = tr.tiembla; q = { ...q, yaw: q.yaw + Math.sin(s.t * 47) * w, pitch: q.pitch + Math.sin(s.t * 39 + 1) * w * 0.8 }; }
    cam.pose = q;
  }

  // ---- gestos
  function iniciarGesto(p, instante = false) {
    const q = p.quien;
    capturar(q);
    const k = clave(q);
    try {
      switch (p.accion) {
        case 'caminar': {
          const d = resolverRef(p.a, s.mw);
          if (!d) { s.errores.push(`caminar: destino sin resolver (${q})`); return false; }
          if (instante) { mundo.teletransportar?.(k, d, p.mira !== undefined ? resolverRef(p.mira, s.mw) : null); s.gestos.delete(q); return true; }
          const vel = num(p.vel, 1.4);
          const desdeP = resolverRef(q === 'jugador' ? 'jugador' : q, s.mw);
          const largo = desdeP ? Math.hypot(d.x - desdeP.x, d.z - desdeP.z) : 20;
          mundo.caminar?.(k, d, { vel, mira: p.mira !== undefined ? resolverRef(p.mira, s.mw) : null });
          s.gestos.set(q, { tipo: 'caminar', destino: d, t: 0, limite: largo / Math.max(0.3, vel) * 1.8 + 6 });
          return true;
        }
        case 'mirar': {
          const d = resolverRef(p.a, s.mw);
          if (!d) return false;
          mundo.mirar?.(k, d, instante);
          if (!instante) s.gestos.set(q, { tipo: 'mirar', t: 0, limite: 1.2 });
          return true;
        }
        case 'posar':
          mundo.posar?.(k, p.pose, instante ? 0 : Math.max(0.2, num(p.dur, 2.4)));
          if (!instante) s.gestos.set(q, { tipo: 'posar', t: 0, limite: Math.max(0.2, num(p.dur, 2.4)) });
          return true;
        case 'aparecer': {
          const d = resolverRef(p.a, s.mw);
          if (!d) return false;
          mundo.aparecer?.(k, d, p.mira !== undefined ? resolverRef(p.mira, s.mw) : null);
          s.gestos.delete(q);
          return true;
        }
        case 'desaparecer': mundo.desaparecer?.(k); s.gestos.delete(q); return true;
        default: return false;
      }
    } catch (e) { alError(`gesto ${q}/${p.accion}: ${e?.message || e}`); return false; }
  }
  function tickGestos(dt) {
    for (const [q, g] of [...s.gestos]) {
      g.t += dt;
      let listo = g.t >= g.limite;
      if (g.tipo === 'caminar') {
        const ocupado = mundo.ocupado ? !!mundo.ocupado(clave(q)) : false;
        listo = !ocupado || g.t >= g.limite;
        if (g.t >= g.limite && ocupado) { try { mundo.teletransportar?.(clave(q), g.destino, null); } catch { /* sigue */ } }   // trabado: se lo deja en su lugar
      }
      if (listo) g.listo = true;
    }
  }
  const gestoListo = (q) => { const g = s.gestos.get(q); return !g || g.listo === true; };

  // ---- la hora y el clima
  function iniciarHora(p, instante = false) {
    const ahora = num(mundo.horaActual?.(), 12);
    const final = ((((Number.isFinite(Number(p.mas)) && p.a === undefined) ? ahora + num(p.mas) : num(p.a)) % 24) + 24) % 24;
    if (instante || num(p.dur, 4) <= 0) { s.horaMov = null; mundo.hora?.(final); return; }
    // siempre hacia adelante (de las 15 a las 7 es de noche corrida, no para atrás), salvo `atras: true`
    let delta = final - ahora;
    if (p.atras === true) { if (delta > 12) delta -= 24; if (delta < -12) delta += 24; }
    else if (delta < 0) delta += 24;
    s.horaMov = { desde: ahora, delta, final, t: 0, dur: Math.max(0.05, num(p.dur, 4)), suave: p.suave || 'suave' };
  }
  function tickHora(dt) {
    const h = s.horaMov;
    if (!h) return;
    h.t += dt;
    const u = Math.min(1, h.t / h.dur);
    const v = u >= 1 ? h.final : (((h.desde + h.delta * suavizar(h.suave, u)) % 24) + 24) % 24;
    try { mundo.hora?.(v); } catch (e) { alError(`hora: ${e?.message || e}`); }
    if (u >= 1) s.horaMov = null;
  }
  function iniciarClima(p, instante = false) {
    try { mundo.clima?.(p.estado, instante ? 0 : Math.max(0, num(p.dur, 4))); } catch (e) { alError(`clima: ${e?.message || e}`); }
  }

  // ---- el fundido
  function iniciarFundido(p, instante = false) {
    const f = s.fundido;
    const dur = instante ? 0 : Math.max(0.05, num(p.dur, 1.2));
    if (p.a === 'cruzado') {
      if (instante) { for (const q of p.alMedio || []) instantaneo(q); f.a = 0; f.hasta = 0; f.cruz = null; return; }
      f.cruz = { fase: 'ida', t: 0, dur: dur / 2, mantener: Math.max(0, num(p.mantener, 0.25)), alMedio: Array.isArray(p.alMedio) ? p.alMedio : [] };
      f.desde = f.a; f.hasta = 1; f.t = 0; f.dur = f.cruz.dur;
      return;
    }
    f.cruz = null;
    f.desde = f.a; f.hasta = p.a === 'negro' ? 1 : 0; f.t = 0; f.dur = dur;
    if (!dur) f.a = f.hasta;
  }
  function tickFundido(dt) {
    const f = s.fundido;
    if (f.cruz) {
      const c = f.cruz;
      if (c.fase === 'mantener') {
        c.t += dt;
        if (c.t >= c.mantener) { c.fase = 'vuelta'; f.desde = 1; f.hasta = 0; f.t = 0; f.dur = c.dur; }
        return;
      }
      f.t += dt;
      const u = Math.min(1, f.t / f.dur);
      f.a = lerp(f.desde, f.hasta, SUAVES.suave(u));
      if (u >= 1) {
        if (c.fase === 'ida') { c.fase = 'mantener'; c.t = 0; for (const q of c.alMedio) instantaneo(q); }
        else f.cruz = null;
      }
      return;
    }
    if (f.dur > 0 && f.a !== f.hasta) {
      f.t += dt;
      const u = Math.min(1, f.t / f.dur);
      f.a = lerp(f.desde, f.hasta, SUAVES.suave(u));
      if (u >= 1) f.a = f.hasta;
    }
  }
  const fundidoCorriendo = () => !!s.fundido.cruz || (s.fundido.dur > 0 && s.fundido.a !== s.fundido.hasta);

  // ---- efectos
  function correrEfecto(nombre, args) {
    const fn = efectos[nombre];
    if (typeof fn !== 'function') { s.errores.push(`efecto sin registrar: ${nombre}`); return; }
    try { fn(args, { escena: s.id, elecciones: { ...s.elecciones }, saltando: s.saltada, mundo, dia: dia() }); }
    catch (e) { s.errores.push(`efecto ${nombre}: ${e?.message || e}`); alError(`efecto ${nombre}: ${e?.message || e}`); }
  }

  // Un paso aplicado «de golpe» (al saltar, o dentro de un fundido). Devuelve una etiqueta si el paso salta a otra parte.
  function instantaneo(p) {
    if (!p || !cumple(p.si)) return null;
    switch (p.tipo) {
      case 'gesto': iniciarGesto(p, true); break;
      case 'hora': iniciarHora(p, true); break;
      case 'clima': iniciarClima(p, true); break;
      case 'efecto': correrEfecto(p.nombre, p.args); break;
      case 'eleccion': {
        if (s.elecciones[p.id] !== undefined) break;
        const i = acotar(Math.floor(num(p.porDefecto, 0)), 0, p.opciones.length - 1);
        return aplicarOpcion(p, p.opciones[i]);
      }
      case 'fundido': if (p.a !== 'cruzado') break; for (const q of p.alMedio || []) instantaneo(q); break;
      case 'salto': return p.a;
      case 'plano': {
        // el último plano que se salta deja la cámara donde terminaría
        const f = compilarPlano(p, { mundo: s.mw, base: s.base });
        const q = f ? f(1) : null;
        if (q) s.camara.pose = q;
        break;
      }
      default: break;
    }
    return null;
  }
  function aplicarOpcion(p, op) {
    s.elecciones[p.id] = op.id;
    if (op.efecto) correrEfecto(op.efecto, op.args);
    return op.a !== undefined ? op.a : null;
  }

  // ---- los pasos
  function irA(etq) { const i = s.c.etiquetas[etq]; if (Number.isInteger(i)) s.idx = i; }
  function siguientePaso() { if (s.idx >= s.e.pasos.length) return null; return s.e.pasos[s.idx++]; }

  function lineaActual() { const d = s.dialogo; return d ? d.lineas[d.i] : null; }
  function empezarLinea() {
    const d = s.dialogo, l = d.lineas[d.i];
    d.car = 0; d.listaLinea = false; d.espera = 0;
    const q = l.quien !== undefined ? l.quien : d.quien;
    d.hablaQuien = q;
    if (l.gesto && objeto(l.gesto)) iniciarGesto({ ...l.gesto, quien: l.gesto.quien || q }, false);
    if (l.plano && objeto(l.plano)) iniciarPlano(l.plano);
    d.chars = Array.from(l.texto);
  }
  function iniciarDialogo(p) {
    const lineas = (Array.isArray(p.lineas) ? p.lineas : [p.texto]).map((l) => (typeof l === 'string' ? { texto: l } : l)).filter((l) => l && typeof l.texto === 'string');
    if (!lineas.length) return false;
    s.dialogo = { quien: p.quien, lineas, i: 0, car: 0, listaLinea: false, chars: [], espera: 0, auto: p.auto !== undefined ? num(p.auto) : null, cps: num(p.cps, CPS) };
    empezarLinea();
    return true;
  }
  function tickDialogo(dt) {
    const d = s.dialogo;
    if (!d) return true;
    if (!d.listaLinea) {
      d.car += dt * d.cps * (s.acelerando ? ACELERADO : 1);
      if (d.car >= d.chars.length) { d.car = d.chars.length; d.listaLinea = true; d.espera = 0; }
    } else if (d.auto !== null) {
      d.espera += dt;
      if (d.espera >= d.auto) return avanzarLinea();
    }
    return false;
  }
  // devuelve true si el diálogo terminó
  function avanzarLinea() {
    const d = s.dialogo;
    if (!d.listaLinea) { d.car = d.chars.length; d.listaLinea = true; d.espera = 0; return false; }
    d.i++;
    if (d.i >= d.lineas.length) { s.dialogo = null; return true; }
    empezarLinea();
    return false;
  }

  function iniciarPaso(p) {
    if (!cumple(p.si)) return;
    switch (p.tipo) {
      case 'plano': {
        if (!iniciarPlano(p)) { s.errores.push('plano sin referencia resuelta'); return; }
        if (p.sinEsperar !== true) s.actual = { tipo: 'plano', t: 0, dur: Math.max(0.05, num(p.dur, 3)) };
        break;
      }
      case 'dialogo': if (iniciarDialogo(p)) s.actual = { tipo: 'dialogo' }; break;
      case 'gesto': {
        const ok = iniciarGesto(p, false);
        const espera = p.sinEsperar === true ? false : (p.accion === 'caminar' || p.accion === 'posar' || p.accion === 'mirar');
        // mirar y aparecer no frenan la escena salvo que se pida: son parte de la composición
        if (ok && espera && p.accion !== 'mirar') s.actual = { tipo: 'gesto', quien: p.quien };
        else if (ok && p.accion === 'mirar' && p.esperar === true) s.actual = { tipo: 'gesto', quien: p.quien };
        break;
      }
      case 'espera': {
        if (Number.isFinite(Number(p.hastaHora))) {
          iniciarHora({ a: p.hastaHora, dur: num(p.dur, 4), suave: p.suave || 'lineal' });
          s.actual = { tipo: 'hora-espera' };
        } else s.actual = { tipo: 'espera', t: 0, dur: Math.max(0, num(p.dur)) };
        break;
      }
      case 'sonido': try { mundo.sonido?.(p.id, p); } catch (e) { alError(`sonido: ${e?.message || e}`); } break;
      case 'hora': iniciarHora(p); if (p.sinEsperar !== true && s.horaMov) s.actual = { tipo: 'hora-espera' }; break;
      case 'clima': iniciarClima(p); if (p.esperar === true) s.actual = { tipo: 'espera', t: 0, dur: num(p.dur, 4) }; break;
      case 'eleccion':
        s.eleccion = { p, i: acotar(Math.floor(num(p.porDefecto, 0)), 0, p.opciones.length - 1) };
        s.actual = { tipo: 'eleccion' };
        break;
      case 'efecto': correrEfecto(p.nombre, p.args); break;
      case 'fundido': iniciarFundido(p); if (p.sinEsperar !== true) s.actual = { tipo: 'fundido' }; break;
      case 'salto': irA(p.a); break;
      default: break;
    }
  }
  function tickActual(dt) {
    const a = s.actual;
    if (!a) return;
    switch (a.tipo) {
      case 'plano': case 'espera': a.t += dt; if (a.t >= a.dur) s.actual = null; break;
      case 'dialogo': if (tickDialogo(dt)) s.actual = null; break;
      case 'gesto': if (gestoListo(a.quien)) { s.gestos.delete(a.quien); s.actual = null; } break;
      case 'hora-espera': if (!s.horaMov) s.actual = null; break;
      case 'fundido': if (!fundidoCorriendo()) s.actual = null; break;
      case 'eleccion': break;   // espera a elegir()
      default: s.actual = null;
    }
  }

  // ---- el cuadro
  function actualizar(dt) {
    reloj += Math.max(0, dt);
    if (!s) return;
    dt = acotar(num(dt), 0, 0.25);
    s.t += dt;
    if (s.fase === 'saliendo') { tickSalida(dt); return; }
    tickCamara(dt); tickGestos(dt); tickHora(dt); tickFundido(dt);
    let guarda = 0;
    while (!s.actual && s.fase === 'corriendo' && guarda++ < 64) {
      if (++s.guarda > TOPE_PASOS) { s.errores.push('demasiados pasos'); terminar(false); return; }
      const p = siguientePaso();
      if (!p) { if (!s.gestos.size || [...s.gestos.values()].every((g) => g.listo)) { terminar(false); return; } s.actual = { tipo: 'espera', t: 0, dur: 0.1 }; break; }
      try { iniciarPaso(p); } catch (e) { s.errores.push(`paso ${s.idx}: ${e?.message || e}`); alError(`escena ${s.id}, paso ${s.idx}: ${e?.message || e}`); }
    }
    if (s.fase === 'corriendo') tickActual(dt);
  }

  // ---- terminar / saltar
  function completarPendientes() {
    // lo que quedó en marcha se completa: los que caminaban llegan, la hora llega, el fundido se aclara
    for (const [q, g] of [...s.gestos]) { if (g.tipo === 'caminar') { try { mundo.teletransportar?.(clave(q), g.destino, null); } catch { /* sigue */ } } }
    s.gestos.clear();
    if (s.horaMov) { const f = s.horaMov.final; s.horaMov = null; try { mundo.hora?.(f); } catch { /* sigue */ } }
    s.dialogo = null; s.eleccion = null;
  }
  function terminar(saltada) {
    if (!s || s.fase === 'saliendo') return;
    completarPendientes();
    s.saltada = !!saltada;
    // se marca vista al terminar: guardar a mitad de la escena la deja pendiente
    const g = estadoGuardado();
    if (!s.e.efimera) {
      g.vistas[s.id] = dia();
      if (Object.keys(s.elecciones).length) g.elecciones[s.id] = { ...(Object.hasOwn(g.elecciones, s.id) ? g.elecciones[s.id] : {}), ...s.elecciones };
    }
    s.fase = 'saliendo'; s.actual = null; s.salida = { t: 0 };
    s.resumen = saltada && typeof s.e.resumen === 'string' ? s.e.resumen : '';
    for (const q of s.capturados) { try { mundo.soltar?.(clave(q)); } catch (e) { alError(`soltar ${q}: ${e?.message || e}`); } }
    s.capturados.clear();
  }
  function tickSalida(dt) {
    const o = s.salida;
    o.t += dt;
    tickFundido(dt);
    if (s.fundido.a > 0 && !s.fundido.cruz) { const f = s.fundido; if (f.hasta !== 0 || f.dur === 0) { f.desde = f.a; f.hasta = 0; f.t = 0; f.dur = SALIDA_CAMARA * 0.8; } }
    if (o.t >= SALIDA_CAMARA && s.fundido.a <= 0.001) cerrarSesion();
  }
  function cerrarSesion() {
    const r = { id: s.id, saltada: s.saltada, elecciones: { ...s.elecciones }, errores: [...s.errores] };
    s = null;
    try { mundo.alTerminar?.(r); } catch (e) { alError(`alTerminar: ${e?.message || e}`); }
    try { opc.alTerminar?.(r); } catch (e) { alError(`alTerminar: ${e?.message || e}`); }
  }
  // Salta lo que falta aplicando todo en orden y deja el mundo en el estado final
  function saltar() {
    if (!s || s.fase !== 'corriendo') return false;
    // la elección que estaba abierta se resuelve con la de por defecto
    s.saltando = true; s.saltada = true;
    const a = s.actual;
    let salto = null;
    if (a?.tipo === 'eleccion') { s.eleccion = null; salto = instantaneo(s.e.pasos[s.idx - 1]); }
    s.actual = null; s.dialogo = null;
    // el paso actual no bloqueante a medias (gesto, hora, fundido) se completa: se re-aplica en su estado final
    if (salto) irA(salto);
    let n = 0;
    while (s.idx < s.e.pasos.length && n++ < TOPE_PASOS) {
      const p = s.e.pasos[s.idx++];
      const et = instantaneo(p);
      if (et) irA(et);
    }
    s.fundido.cruz = null;
    terminar(true);
    return true;
  }
  // Esc: la primera vez pide confirmar; la segunda (dentro de CONFIRMAR_SALTO segundos) salta. Devuelve 'confirmar' | 'saltada' | null.
  function pedirSaltar() {
    if (!s || s.fase !== 'corriendo') return null;
    if (reloj <= s.confirmarHasta) { saltar(); return 'saltada'; }
    s.confirmarHasta = reloj + CONFIRMAR_SALTO;
    return 'confirmar';
  }

  // ---- entradas del jugador
  function avanzar() {
    if (!s || s.fase !== 'corriendo' || !s.actual) return false;
    if (s.actual.tipo === 'dialogo' && s.dialogo) { if (avanzarLinea()) s.actual = null; return true; }
    if (s.actual.tipo === 'eleccion') return elegir(s.eleccion.i);
    return false;
  }
  function moverEleccion(d) {
    if (!s || !s.eleccion) return false;
    const n = s.eleccion.p.opciones.length;
    s.eleccion.i = ((s.eleccion.i + d) % n + n) % n;
    return true;
  }
  function elegir(i) {
    if (!s || s.fase !== 'corriendo' || !s.eleccion) return false;
    const p = s.eleccion.p;
    i = Math.floor(num(i, -1));
    if (i < 0 || i >= p.opciones.length) return false;
    const salto = aplicarOpcion(p, p.opciones[i]);
    s.eleccion = null; s.actual = null;
    if (salto) irA(salto);
    return true;
  }
  const acelerar = (si) => { if (s) s.acelerando = !!si; };

  // ---- lo que ve la pantalla
  function datos() {
    if (!s) return null;
    const d = s.dialogo, l = d ? d.lineas[d.i] : null;
    let dialogo = null;
    if (d && l && s.fase === 'corriendo') {
      const q = d.hablaQuien;
      dialogo = { quien: q || '', nombre: nombreDe(q), color: colorDe(q), texto: d.chars.slice(0, Math.floor(d.car)).join(''), completo: d.listaLinea, linea: d.i + 1, de: d.lineas.length };
    }
    const e = s.eleccion && s.fase === 'corriendo'
      ? { id: s.eleccion.p.id, pregunta: s.eleccion.p.pregunta || '', indice: s.eleccion.i, opciones: s.eleccion.p.opciones.map((o) => ({ id: o.id, texto: o.texto })) }
      : null;
    return {
      id: s.id, titulo: s.e.titulo || '', fase: s.fase, barras: s.fase === 'corriendo', fundido: s.fundido.a,
      dialogo, eleccion: e, confirmar: reloj <= s.confirmarHasta && s.fase === 'corriendo', resumen: s.resumen, saltada: s.saltada,
    };
  }
  // La cámara de este cuadro: { x, y, z, yaw, pitch, fov } en el mundo, o null si no hay que tocarla. En la salida se interpola hacia la
  // cámara del jugador (`mundo.camaraJugador()`, que ya la dejó puesta jugador.actualizar).
  function camara() {
    if (!s) return null;
    const c = s.camara;
    if (s.fase === 'saliendo') {
      const vivo = mundo.camaraJugador ? mundo.camaraJugador() : null;
      if (!c.pose || !poseValida(vivo)) return null;
      const u = SUAVES.suave(acotar(s.salida.t / SALIDA_CAMARA, 0, 1));
      return u >= 1 ? null : mezclarPoses(c.pose, vivo, u);
    }
    return c.pose && poseValida(c.pose) ? { ...c.pose } : null;
  }
  // lo que se guarda: las vistas sin la escena en curso (aunque `terminar` todavía no corrió, esta nunca está)
  function paraGuardar() {
    const g = estadoGuardado();
    const vistas = { ...g.vistas };
    if (s && s.fase === 'corriendo') delete vistas[s.id];
    return { vistas, elecciones: JSON.parse(JSON.stringify(g.elecciones)) };
  }

  return {
    registrar, quitar, registrarEfecto, registrarCondicion, hay, ids, vista, elegible, buscarElegible, efectosFaltantes, cumple,
    disparar, actualizar, avanzar, elegir, moverEleccion, saltar, pedirSaltar, acelerar,
    datos, camara, paraGuardar,
    activa: () => !!s,
    corriendo: () => !!s && s.fase === 'corriendo',
    idActual: () => (s ? s.id : null),
    fase: () => (s ? s.fase : null),
    elecciones: () => (s ? { ...s.elecciones } : {}),
    errores: () => (s ? [...s.errores] : []),
    // para pruebas
    __sesion: () => s,
  };
}
