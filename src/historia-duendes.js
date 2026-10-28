// 4.13.0 (A): duendes en la Historia. INFRAESTRUCTURA compartida: la usa la presencia y el encuentro de los capítulos 5 y 6
// (historia-presencia.js) y la usa la noche de defensa (historia-noche*.js).
//
// La Historia no es un modo aparte: es el Relax con `ajustes.relaxTipo = 'historia'`. Ahí los duendes no existían (la risa y las
// voces se apagan con `sonido.relax`, decisión de la 3.8.5; el Desafío es otro modo y no se toca). Este módulo les da lo mínimo
// para estar en escena sin traer las reglas del Desafío:
//
//   · instalar y precalentar los modelos (`instalarDuendes` + `precalentarDuendes`) SÓLO si la Historia está en marcha, y en la
//     carga (nunca a mitad de juego: compilar los shaders a mitad de juego es un tirón y las partidas reales cuentan programas);
//   · un animador mínimo y suelto (sin vida, daño, IA de oleadas ni cajas de golpe): idle, mirar al jugador, caminar o correr
//     hasta un punto, saludar, agazaparse y desaparecer;
//   · la voz puntual: la risa del duende suena con `sonido.relax` apagado SÓLO durante la llamada (el Relax normal sigue mudo).
//
// ------------------------------------------------------------------ API (para quien la reutilice)
//   const dh = crearDuendesHistoria({
//     escena,                          // THREE.Scene del juego
//     altura: (x, z) => y,             // el terreno (T.altura)
//     jugador: () => ({ x, z }),       // dónde está el jugador (jugador.estado.pos)
//     sonido: () => sonido,            // el motor de sonido (sólo para la risa)
//     noche: () => 0..1,               // qué tan de noche está (1 - luz.dia); sin esto, 0
//     activo: () => true|false,        // ¿la Historia está en marcha? (relaxTipo === 'historia' o progreso.historia.activa)
//     compilar: (raiz) => void,        // opcional: compilar ya los shaders de lo instalado (sólo si se asegura a mitad de juego, ver `asegurar`)
//   });
//   dh.paraCompilar()      // en la CARGA, antes de compilar los programas: instala + precalienta (no hace nada si no es Historia)
//   dh.asegurar()          // instala + precalienta si todavía no se hizo (idempotente). Devuelve true si quedó listo.
//                          //   Si se llama a mitad de juego (la Historia se empieza desde la pausa) llama a `ctx.compilar()`.
//   dh.listo()             // ¿instalado y precalentado?
//   const d = dh.aparecer(tipo, { x, z, rumbo, mira, viejo, etapa, agazapado })
//                          // tipo: 'rastreador' (travieso), 'saltador', 'bruto' (viejo), 'tirador', ... (los de TIPOS_ALIEN)
//                          // devuelve el duende suelto `d` (null si no está listo o si la Historia no está en marcha)
//   d.mirar(true|false)    // girar despacio hacia el jugador y quedarse mirándolo
//   d.irA(x, z, { correr, alLlegar })      // caminar (o correr) hasta el punto
//   d.huir({ x, z } | null, { desaparecer: true })   // correr (hacia el punto o alejándose del jugador) y desaparecer
//   d.saludar(segundos)    // levanta una mano y se ríe (sin palabras)
//   d.reir(intensidad)     // la risa (con voz si el sonido está listo) y el gesto
//   d.esconder()           // se agazapa y se disuelve
//   d.quitar()             // lo saca ya de la escena
//   d.estado               // 'quieto' | 'mirando' | 'yendo' | 'huyendo' | 'saludando' | 'escondiendo' | 'fuera'
//   dh.actualizar(dt)      // una vez por cuadro (ya se llama desde el juego cuando la Historia está en marcha)
//   dh.lista()             // los duendes vivos
//   dh.limpiar()           // saca a todos
//   dh.reir(pos, { clase: 'chico'|'viejo'|'mandamas', intensidad, vol })   // risa suelta en un punto del mundo
//   dh.prepararVoz()       // sintetiza las risas en la cola (la primera vez que se las necesita; reir() lo pide solo)
//
// Los duendes de acá NO hablan: se ven, se oyen (risas) y se mueven. Cada duende vivo cuesta lo de uno del Desafío (instanciado):
// pocos a la vez (`MAXIMO`).
import { crearDuende, instalarDuendes, precalentarDuendes } from './desafio-duendes.js';
import { claseDeRisa } from './risa-duende.js';
import { VARIANTES_RISA } from './risa-duende.js';

export const MAXIMO = 8;                    // duendes sueltos a la vez (la presencia usa 1 o 2; la noche, los suyos aparte)
export const VEL_CAMINA = 1.5;              // m/s
export const VEL_CORRE = 4.6;
const GIRO = 5.5;                           // rad/s

// ¿Hay Historia en marcha? (la única condición para que los duendes existan fuera del Desafío)
export function hayHistoria(ajustes, historia) {
  return !!(ajustes && ajustes.relaxTipo === 'historia') || !!(historia && historia.activa === true);
}

// La risa de un duende en un punto, con la voz encendida SÓLO durante la llamada. Devuelve lo que devolvió el motor:
// 0 si no tocaba (tope de risas, sin audio), null si las risas todavía no están hechas (se piden a la cola), o el objeto de la risa.
export function reirDuende(sonido, pos, { clase = 'chico', intensidad = 0.7, vol = 1 } = {}) {
  if (!sonido || !sonido.ctx || typeof sonido.risaDuende !== 'function') return 0;
  const antes = sonido.relax;
  sonido.relax = false;
  try {
    const r = sonido.risaDuende(clase, { pos, intensidad, vol });
    if (r === null) prepararVozDuende(sonido, [clase]);   // las risas todavía no estaban: se piden y suena la próxima vez
    return r;
  } finally { sonido.relax = antes; }
}
// Las risas de las clases pedidas, a la cola de síntesis del motor (no traba: va de a poco). Idempotente.
export function prepararVozDuende(sonido, clases = ['chico']) {
  if (!sonido || !sonido.ctx || typeof sonido.prepararRisa !== 'function') return false;
  for (const clase of clases) for (let k = 0; k < VARIANTES_RISA; k++) sonido.prepararRisa(clase, k);
  return true;
}

const angulo = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };

export function crearDuendesHistoria(ctx) {
  const vivos = [], libres = {};
  let instalado = false, precalentado = false, raiz = null;
  const noche = () => Math.max(0, Math.min(1, Number(ctx.noche?.()) || 0));
  const activo = () => (typeof ctx.activo === 'function' ? !!ctx.activo() : true);
  let vozPedida = false;

  // En la carga: sólo si la Historia está en marcha. A mitad de juego, `asegurar` compila ya (queda detrás de la pausa o la tarjeta).
  function paraCompilar() {
    if (!activo()) return false;
    if (!instalado) { raiz = instalarDuendes(ctx.escena); instalado = true; }
    if (!precalentado) { precalentarDuendes(); precalentado = true; }
    return true;
  }
  function asegurar() {
    if (instalado && precalentado) return true;
    if (!paraCompilar()) return false;
    try { ctx.compilar?.(raiz); } catch (e) { console.warn('duendes de la historia: compilar', e && e.message); }
    return true;
  }
  const listo = () => instalado && precalentado;

  function prepararVoz() {
    vozPedida = true;
    return prepararVozDuende(ctx.sonido?.(), ['chico', 'viejo']);
  }
  function reir(pos, o = {}) {
    if (!vozPedida) prepararVoz();
    return reirDuende(ctx.sonido?.(), pos, o);
  }

  function aparecer(tipo = 'rastreador', o = {}) {
    if (!listo() || !activo()) return null;
    if (vivos.length >= MAXIMO) { const viejo = vivos.find((v) => v.estado === 'fuera') || vivos[0]; viejo.quitar(); }
    const m = (libres[tipo] || (libres[tipo] = [])).pop() || crearDuende(tipo);   // (se reciclan: cada duende creado ocupa una fila de la textura de huesos para siempre)
    m.reiniciar();
    if (o.viejo || o.etapa !== undefined) m.vestir(!!o.viejo, o.etapa ?? 1);
    const yo = ctx.jugador?.() || { x: 0, z: 0 };
    const e = { dt: 0, velocidad: 0, golpe: 0, ataca: false, carrera: false, apuntando: false, agazapado: false, enredado: false, saltando: 0, noche: 0, reflejo: 0, jugador: yo };
    const s = {
      m, tipo, x: Number(o.x) || 0, z: Number(o.z) || 0,
      rumbo: Number.isFinite(o.rumbo) ? o.rumbo : Math.atan2(yo.x - (Number(o.x) || 0), yo.z - (Number(o.z) || 0)),
      estado: 'quieto', mira: !!o.mira, objetivo: null, correr: false, alLlegar: null, desaparecer: false,
      disolver: 0, tEstado: 0, agazapado: !!o.agazapado, saludo: 0, e, vel: 0,
    };
    const d = {
      m, tipo,
      get estado() { return s.estado; },
      get x() { return s.x; }, get z() { return s.z; },
      get rumbo() { return s.rumbo; },
      get posicion() { return { x: s.x, y: ctx.altura ? ctx.altura(s.x, s.z) : 0, z: s.z }; },
      mirar(si = true) { s.mira = !!si; if (s.estado === 'quieto' && si) s.estado = 'mirando'; else if (s.estado === 'mirando' && !si) s.estado = 'quieto'; return d; },
      irA(x, z, op = {}) { s.objetivo = { x, z }; s.correr = !!op.correr; s.alLlegar = typeof op.alLlegar === 'function' ? op.alLlegar : null; s.desaparecer = false; s.estado = 'yendo'; return d; },
      huir(hacia = null, op = {}) {
        const yo2 = ctx.jugador?.() || { x: s.x, z: s.z + 1 };
        let tx, tz;
        if (hacia && Number.isFinite(hacia.x) && Number.isFinite(hacia.z)) { tx = hacia.x; tz = hacia.z; }
        else { const dx = s.x - yo2.x, dz = s.z - yo2.z, l = Math.hypot(dx, dz) || 1; tx = s.x + (dx / l) * 40; tz = s.z + (dz / l) * 40; }
        s.objetivo = { x: tx, z: tz }; s.correr = true; s.alLlegar = null; s.desaparecer = op.desaparecer !== false; s.estado = 'huyendo'; s.tEstado = 0;
        return d;
      },
      saludar(seg = 2.2) { s.saludo = Math.max(0.2, seg); s.estado = 'saludando'; m.chillar(); return d; },
      reir(intensidad = 0.7) {
        m.chillar();
        return reir(d.posicion, { clase: claseDeRisa(tipo, m.viejo), intensidad });
      },
      esconder() { if (s.estado !== 'escondiendo' && s.estado !== 'fuera') { s.estado = 'escondiendo'; s.tEstado = 0; s.objetivo = null; } return d; },
      quitar() { quitar(s); return d; },
      _s: s,
    };
    s.d = d;
    m.g.position.set(s.x, ctx.altura ? ctx.altura(s.x, s.z) : 0, s.z);
    m.g.rotation.y = s.rumbo;
    ctx.escena.add(m.g);
    vivos.push(d);
    if (s.mira) s.estado = 'mirando';
    return d;
  }

  function quitar(s) {
    if (s.estado === 'fuera' && !s.m.g.parent) return;
    s.estado = 'fuera';
    s.m.g.parent?.remove(s.m.g);
    s.m.reiniciar();
    (libres[s.tipo] || (libres[s.tipo] = [])).push(s.m);
    const i = vivos.indexOf(s.d);
    if (i >= 0) vivos.splice(i, 1);
  }

  function actualizar(dt) {
    if (!vivos.length) return;
    dt = Math.min(0.1, Math.max(0, Number(dt) || 0));
    const yo = ctx.jugador?.() || { x: 0, z: 0 };
    const n = noche();
    for (const d of vivos.slice()) {
      const s = d._s, e = s.e;
      s.tEstado += dt;
      let vel = 0, correr = false;
      // a dónde tiene que apuntar el cuerpo
      let rumboObj = null;
      if (s.estado === 'yendo' || s.estado === 'huyendo') {
        const dx = s.objetivo.x - s.x, dz = s.objetivo.z - s.z, dist = Math.hypot(dx, dz);
        if (dist < 0.4) {
          const alLlegar = s.alLlegar; s.alLlegar = null; s.objetivo = null;
          if (s.estado === 'huyendo' && s.desaparecer) { s.estado = 'escondiendo'; s.tEstado = 0; }
          else { s.estado = s.mira ? 'mirando' : 'quieto'; alLlegar?.(d); }
        } else {
          rumboObj = Math.atan2(dx, dz);
          correr = s.correr;
          vel = correr ? VEL_CORRE : VEL_CAMINA;
          // gira y avanza sólo cuando ya mira más o menos para donde va
          const dif = Math.abs(angulo(rumboObj - s.rumbo));
          if (dif > 0.9) vel *= 0.25;
          const paso = Math.min(dist, vel * dt);
          s.x += Math.sin(s.rumbo) * paso; s.z += Math.cos(s.rumbo) * paso;
        }
      } else if (s.estado === 'mirando' || (s.mira && s.estado === 'saludando')) {
        rumboObj = Math.atan2(yo.x - s.x, yo.z - s.z);
      } else if (s.estado === 'saludando') {
        rumboObj = Math.atan2(yo.x - s.x, yo.z - s.z);
        s.saludo -= dt;
        if (s.saludo <= 0) s.estado = s.mira ? 'mirando' : 'quieto';
      } else if (s.estado === 'escondiendo') {
        // se agacha medio segundo y se disuelve en uno
        s.disolver = Math.max(0, Math.min(1, (s.tEstado - 0.45) / 0.9));
        s.m.disolver(s.disolver);
        if (s.disolver >= 1) { quitar(s); continue; }
      }
      if (rumboObj !== null) {
        const dif = angulo(rumboObj - s.rumbo), paso = GIRO * dt * (correr ? 1.6 : 1);
        s.rumbo += Math.abs(dif) <= paso ? dif : Math.sign(dif) * paso;
      }
      s.vel = vel;
      s.m.g.position.set(s.x, ctx.altura ? ctx.altura(s.x, s.z) : 0, s.z);
      s.m.g.rotation.y = s.rumbo;
      e.dt = dt; e.jugador = yo; e.velocidad = vel; e.carrera = correr;
      e.agazapado = s.agazapado || s.estado === 'escondiendo';
      e.apuntando = s.estado === 'saludando';
      e.noche = n;
      s.m.animar(e);
      s.m.detalle(Math.hypot(yo.x - s.x, yo.z - s.z));
    }
  }

  function limpiar() { for (const d of vivos.slice()) quitar(d._s); }

  return { paraCompilar, asegurar, listo, aparecer, actualizar, limpiar, reir, prepararVoz, lista: () => vivos.slice(), cantidad: () => vivos.length };
}
