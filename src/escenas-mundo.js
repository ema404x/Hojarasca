// 4.14.0: las escenas de la Historia, en el juego. Junta el director (escenas.js, puro) con el mundo: mueve y posa a los personajes que ya
// existen (gente.js / aldea-gente.js: los toma igual que la cantina y el amor, con `conVos`), pone la cámara dirigida y la devuelve al
// jugador, y dibuja lo de pantalla con HTML y CSS (barras de cine, caja de diálogo, elecciones, fundido): no agrega ni un programa de
// shader ni una luz. Sólo teclado y ratón.
//
// Lo que necesita de main.js (el enganche, mínimo) está en `ctx`; ver el llamado en main.js y CAMBIOS_4_14_0.md.
import { crearDirector, crearMirada, escenasDe, escenasNuevas, PERSONAJES_BASE } from './escenas.js';
import { ESCENA_DEMO, ID_ESCENA_DEMO } from './escenas-demo.js';

const num = (v, d = 0) => (Number.isFinite(Number(v)) && v !== null && v !== '' ? Number(v) : d);
const acotar = (v, a, b) => Math.max(a, Math.min(b, v));
const suave = (u) => { u = acotar(u, 0, 1); return u * u * (3 - 2 * u); };
const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export const CSS_ESCENAS = `
#escena-capa { position: fixed; inset: 0; z-index: 43; display: none; cursor: default; }
#escena-capa.activa { display: block; }
body.escena-tapada #escena-capa, body.escena-tapada #escena-dialogo, body.escena-tapada .escena-barra, body.escena-tapada #escena-velo, body.escena-tapada #escena-pie, body.escena-tapada #escena-aviso { visibility: hidden; pointer-events: none; }   /* 4.17.1: con la pausa, la guía o la portada encima, la escena no tapa nada ni recibe clics */
.escena-barra { position: fixed; left: 0; right: 0; height: 0; background: #000; z-index: 44; pointer-events: none; transition: height .7s cubic-bezier(.3,.7,.3,1); }
.escena-barra.arriba { top: 0; }
.escena-barra.abajo { bottom: 0; }
body.escena-en-curso .escena-barra { height: 11.5vh; }
body.escena-saliendo .escena-barra { height: 0; transition-duration: .9s; }
body.escena-en-curso #hud, body.escena-en-curso #notas { opacity: 0; pointer-events: none; transition: opacity .4s; }
#escena-velo { position: fixed; inset: 0; background: #000; opacity: 0; z-index: 46; pointer-events: none; }
#escena-dialogo { position: fixed; left: 50%; bottom: calc(11.5vh + 18px); transform: translateX(-50%); width: min(840px, 92vw); z-index: 45; display: none; box-sizing: border-box;
  padding: 14px 22px 12px; background: rgba(16,14,10,.82); border: 1px solid rgba(255,236,200,.2); border-radius: 10px; color: #f3ead6; box-shadow: 0 6px 30px rgba(0,0,0,.45); }
#escena-dialogo.visible { display: block; }
#escena-dialogo .quien { font-family: 'Caveat', cursive; font-size: 28px; font-weight: 700; line-height: 1; margin-bottom: 4px; letter-spacing: .02em; }
#escena-dialogo .texto { font-family: 'Spectral', Georgia, serif; font-size: 21px; line-height: 1.5; min-height: 3em; white-space: pre-wrap; }
#escena-dialogo .sigue { position: absolute; right: 18px; bottom: 8px; font-size: 13px; opacity: 0; transition: opacity .2s; }
#escena-dialogo.completo .sigue { opacity: .75; animation: escena-late 1.2s ease-in-out infinite; }
@keyframes escena-late { 50% { opacity: .25; } }
#escena-dialogo .opciones { display: none; gap: 8px; margin-top: 10px; }
#escena-dialogo.con-opciones .opciones { display: grid; }
#escena-dialogo.con-opciones .sigue { display: none; }
#escena-dialogo.con-opciones .texto { min-height: 0; }
#escena-dialogo .opciones button { display: grid; grid-template-columns: auto 1fr; gap: 10px; align-items: baseline; text-align: left; padding: 9px 14px; border-radius: 8px; border: 1px solid rgba(255,236,200,.18);
  background: rgba(255,236,200,.06); color: inherit; font: inherit; font-size: 18px; cursor: pointer; }
#escena-dialogo .opciones button:hover, #escena-dialogo .opciones button[aria-selected="true"] { background: rgba(255,236,200,.2); border-color: rgba(255,236,200,.5); }
#escena-dialogo .opciones kbd { font-size: 12px; padding: 1px 7px; border-radius: 4px; background: rgba(255,236,200,.16); }
#escena-pie { position: fixed; right: 22px; bottom: calc(5.75vh - 9px); z-index: 45; font-size: 13px; color: rgba(255,236,200,.62); display: none; pointer-events: none; letter-spacing: .02em; }
body.escena-en-curso #escena-pie { display: block; }
#escena-aviso { position: fixed; left: 50%; top: calc(11.5vh + 18px); transform: translateX(-50%); z-index: 45; padding: 8px 18px; border-radius: 8px; background: rgba(16,14,10,.85); color: #f3ead6; font-size: 16px; display: none; pointer-events: none; }
#escena-aviso.visible { display: block; }
`;

// 4.18.0 (C): la cumbrera de tu galponcito sobre el suelo (alto 2,3 + 1,2: construccion.js; la misma de TECHO_GALPONCITO en historia-props-acto3.js)
export const CUMBRERA_GALPONCITO = 3.52;

// Las poses que se hacen acá (el juego no las tiene): se aplican después de gente.actualizar, mezcladas con lo que ya hizo.
// Cada brazo: x (adelante, negativo), z (abrirlo; en el brazo 1, positivo es hacia afuera) y el codo (negativo, doblado).
const mezclar = (o, k, v, w) => { o[k] += (v - o[k]) * w; };
// 4.25.1 (C): el brazo del mate (derecho, sin codo, con la calabaza fundida en la mano) no hace los gestos de escena: levantado, la calabaza subía con el brazo y quedaba
// pegada boca abajo junto a la cabeza. Quien lleva el mate gesticula con el otro brazo (como las poses de quietud: `uno`); `s` es el signo de «hacia afuera» en el brazo z.
export const brazoLibre = (g) => (g.brazos[1].userData.muneca || g.planilla || g.caña ? { b: g.brazos[0], s: -1 } : { b: g.brazos[1], s: 1 });   // (la planilla y la caña también van en la mano derecha: con el brazo en alto la tabla quedaba pegada al brazo)
// la muñeca del mate se contra-gira para que la calabaza quede derecha (lo hace gente.js antes de las poses de escena: si una pose mueve ese brazo hay que rehacerlo)
export const rectificarMate = (g) => { const m = g.muneca, b = g.brazos?.[1]; if (m && b?.userData?.muneca === m) { m.quaternion.copy(b.quaternion).invert(); } };
export const POSES_PROPIAS = {
  saludo: (g, t, w) => {
    const { b, s } = brazoLibre(g), cd = b.userData.codo;
    const o = Math.sin(t * 8.5);
    mezclar(b.rotation, 'x', -2.5, w); mezclar(b.rotation, 'z', s * (0.42 + o * 0.22), w);
    if (cd) mezclar(cd.rotation, 'x', -0.55 + o * 0.2, w);
    g.cabeza.rotation.y += Math.sin(t * 1.4) * 0.05 * w;
  },
  senalar: (g, t, w) => {
    const { b, s } = brazoLibre(g), cd = b.userData.codo;
    mezclar(b.rotation, 'x', -1.5, w); mezclar(b.rotation, 'z', s * 0.1, w);
    if (cd) mezclar(cd.rotation, 'x', -0.12, w);
  },
  asentir: (g, t, w) => { g.cabeza.rotation.x += (0.06 + Math.sin(t * 7) * 0.16) * w; },
  negar: (g, t, w) => { g.cabeza.rotation.y += Math.sin(t * 8) * 0.34 * w; },
  encoger: (g, t, w) => {
    g.brazos.forEach((b, i) => {
      const cd = b.userData.codo;
      mezclar(b.rotation, 'x', -0.4, w); mezclar(b.rotation, 'z', i ? 0.55 : -0.55, w);
      if (cd) mezclar(cd.rotation, 'x', -1.25, w);
    });
    g.cabeza.position.y -= 0.025 * w; g.cabeza.rotation.z += 0.08 * w;
    rectificarMate(g);   // (encoger mueve los dos brazos, también el del mate)
  },
};
// las que ya trae el juego en `g.pose` (gente.js) y en la quietud (gente-cuerpo.js)
const POSES_DEL_JUEGO = new Set(['mirar', 'aplaudir', 'contar', 'brindar', 'tocar', 'palear', 'hachar', 'regar', 'martillar', 'serruchar', 'bailar']);
const POSES_QUIETUD = new Set(['cruzados', 'cintura', 'barba', 'gorro', 'atras', 'delantal', 'juntas']);
export const OBJETOS_EN_MANO = ['planilla', 'caña'];   // (el mate va fundido en la mano y se cuida aparte: ver brazoLibre)
const OCUPAN_LA_MANO = new Set([...POSES_QUIETUD, 'aplaudir', 'palear', 'hachar', 'martillar', 'serruchar', 'tocar', 'bailar', 'contar', 'brindar']);

// 4.26.1 (B): que nadie aparezca de golpe a la vista. Lo que la cámara de la escena ve: el cono de la pose (fov vertical en grados, el ancho según la pantalla) con un
// margen, contra una bola del tamaño de un cuerpo a media altura; a más de `lejos` metros una persona es un punto (no cuenta). Desde `negro` de fundido (o de
// parpadeo) la pantalla está en negro. Un corte es un plano nuevo sin mezcla (lo cuenta el director: `cortes()`).
export const VISTA_ESCENA = { margen: 0.06, radio: 1.0, lejos: 200, negro: 0.9 };   // (a 200 m una persona mide 6 px de alto)
// ¿Se ve a alguien parado en (px, py, pz) (los pies; py sin dato: a la altura de la cámara menos 1,6 m) desde la pose `q` ({ x, y, z, yaw, pitch, fov })?
export function seVeDesde(q, px, py, pz, aspecto = 16 / 9) {
  if (!q || ![q.x, q.y, q.z, q.yaw, q.pitch].every(Number.isFinite) || !Number.isFinite(px) || !Number.isFinite(pz)) return false;
  const V = VISTA_ESCENA;
  const vx = px - q.x, vy = (Number.isFinite(py) ? py : q.y - 1.6) + 0.9 - q.y, vz = pz - q.z;
  if (Math.hypot(vx, vy, vz) > V.lejos) return false;
  const cp = Math.cos(q.pitch), sp = Math.sin(q.pitch), cy = Math.cos(q.yaw), sy = Math.sin(q.yaw);
  const adelante = -vx * cp * sy + vy * sp - vz * cp * cy, derecha = vx * cy - vz * sy, arriba = vx * sp * sy + vy * cp + vz * sp * cy;
  if (adelante < -V.radio) return false;   // detrás de la cámara
  const mv = (num(q.fov, 60) * Math.PI) / 360, mh = Math.atan(Math.tan(mv) * (Number.isFinite(aspecto) && aspecto > 0 ? aspecto : 16 / 9)) + V.margen;
  // las caras del cono: el cuerpo queda afuera si está entero del otro lado de alguna
  if (adelante * Math.sin(mh) - Math.abs(derecha) * Math.cos(mh) < -V.radio) return false;
  if (adelante * Math.sin(mv + V.margen) - Math.abs(arriba) * Math.cos(mv + V.margen) < -V.radio) return false;
  return true;
}

// ctx: { doc, gente(), jugador(), camara, T, col, progreso(), clima(), sonido, modo(), ajustes(), nota(t, s), puedeEmpezar(), fallo(e, donde),
//        alEmpezar(), alTerminar(r), alquilerDeTiempo }
export function crearEscenasMundo(ctx) {
  const doc = ctx.doc || (typeof document !== 'undefined' ? document : null);
  let dom = null;
  const captura = new Map();   // clave → { n, guardado, propia, pose, aviso }
  let pendiente = null;
  const alturaDePie = (T, col, x, z, y) => (ctx.alturaDePie ? ctx.alturaDePie(T, col, x, z, y) : T.altura(x, z));   // (de gente.js: lo pasa main.js; así este módulo no necesita three)
  const mirada = crearMirada();
  const sinHistoria = escenasNuevas();

  // ---- personajes
  const actor = (clave) => {
    const g = ctx.gente?.();
    const lista = g?.gente;
    if (!lista || typeof clave !== 'string') return null;
    if (clave === 'pareja') clave = ctx.parejaClave?.() || clave;   // 4.17.0: «tu pareja» es la persona real con la que estás (o saliendo)
    for (const n of lista) if (n.clave === clave) return n;
    // 4.25.2: la gente de la aldea está en la lista como `aldea-<k>` o `poblador-<k>` (aldea-gente.js, `defFigura`) y las escenas la piden por `k` (jefe, abuela,
    // carpintero…): no se la encontraba nunca (Ernesto, Nélida, Nahuel y Lucía no salían; Tito, Sofía, Herminia y Rosa salían duplicados). Se busca por esas dos
    // formas y con la misma `claveAldea`: así las claves genéricas de otras figuras (visitante, familia, amor, hijo, juez) nunca coinciden con la de una escena.
    const deAldea = `aldea-${clave}`, dePoblador = `poblador-${clave}`;
    for (const n of lista) if ((n.clave === deAldea || n.clave === dePoblador) && n.claveAldea === clave) return n;
    return null;
  };
  // 4.25.1: la entrada de captura de una clave (si la clave es otro nombre de alguien ya capturado —«pareja» y la persona de verdad—, la de él)
  const toma = (clave) => { const c = captura.get(clave); return c?.alias ? (captura.get(c.alias) || null) : (c || null); };
  function capturar(clave) {
    if (!clave || captura.has(clave)) return;
    let n = actor(clave);
    // 4.17.0 (C): Fermín, Belisario y Tobías sólo se arman cuando te acercás a su lugar; si la escena los pide desde lejos (la minga, la veta), se arman ya
    // 4.19.0 (C): «pareja» es la persona real con la que estás: se la arma con su clave de verdad (antes se pedía «pareja» y nadie la sabía armar: la pareja no aparecía en sus escenas si todavía no estaba en la lista de gente)
    const real = clave === 'pareja' ? (ctx.parejaClave?.() || clave) : clave;
    if (!n && ctx.armarYa) { try { n = ctx.armarYa(real) || actor(clave); } catch (e) { ctx.fallo?.(e, 'escenas-armar'); n = null; } }
    if (!n) { captura.set(clave, { n: null }); return; }
    // 4.25.1: la misma persona pedida con dos nombres («pareja» y «rosa» cuando tu pareja es Rosa): la segunda captura guardaba el estado YA tomado por la escena
    // como si fuera el de antes, y al soltar quedaba con `enEscena`, `conVos` y `enCita` para siempre (la aldea ya no la movía). Ahora el segundo nombre es un alias del primero.
    for (const [k, otra] of captura) if (otra.n === n && !otra.alias) { captura.set(clave, { n, alias: k }); return; }
    const guardado = {};
    for (const k of ['conVos', 'enCita', 'pose', 'asiento', 'soloCerca', 'dormido', 'charlaVecinos', 'sinFrenar', 'camino', 'velocidad', 'miraFinal', '__quietud', 'alAmor', 'aBordo', 'enViaje', 'enEscena']) guardado[k] = { tiene: Object.hasOwn(n, k), v: n[k] };
    captura.set(clave, { n, guardado, propia: null, pose: null });
    n.conVos = true; n.enCita = true; n.pose = null; n.asiento = undefined; n.soloCerca = 0; n.dormido = false; n.charlaVecinos = false; n.sinFrenar = true;
    n.enEscena = true;   // 4.19.0: gente.js lo dibuja aunque esté a más de 130 m del jugador (Herminia en su casa, desde el refugio); `soltar` lo devuelve a su estado
    n.aBordo = false; n.enViaje = false;   // 4.16.0: Elsa (la guarda) vive «a bordo» de la trochita y no se dibuja fuera de ella: en una escena sí
    n.camino = []; n.__quietud = null; n.alAmor = false;
    n.animSocial = null; n.__volverA = null;   // 4.25.1: un abrazo o una charla a medias (social-anim.js) le seguía pisando hacia dónde mira durante toda la escena
    delete n.miraFinal;
  }
  function soltar(clave) {
    const c = captura.get(clave);
    if (!c) return;
    captura.delete(clave);
    if (c.alias) return;
    for (const [k, otra] of [...captura]) if (otra.alias === clave) captura.delete(k);
    const n = c.n;
    if (!n) return;
    for (const [k, o] of Object.entries(c.guardado)) { if (o.tiene && o.v !== undefined) n[k] = o.v; else delete n[k]; }
    n.camino = c.guardado.camino.tiene ? c.guardado.camino.v : undefined;
    n.vel = 0;
    // 4.25.1: el de rutina (Ramón, Nicanor, Josefina) que la escena dejó lejos de su parada no se queda haciendo la tarea (Nicanor pescando en el pasto, Josefina anotando) lo que le faltaba de espera: vuelve a su parada
    if (Array.isArray(n.ruta) && n.ruta.length && n.camino === undefined && n.espera > 0) {
      const e = n.ruta[(n.etapa || 0) % n.ruta.length];
      if (e && Number.isFinite(e.x) && Math.hypot(n.pos.x - e.x, n.pos.z - e.z) > 1.5) n.espera = 0;
    }
    devolverObjetos(c);
    if (n.g?.visible === false && !n.dormido) n.g.visible = true;
  }
  // 4.25.1: la caminata de una escena no espera minutos. (1) Si quien camina arranca a más de LEJOS_M de la meta (la gente de la aldea o del campo puede estar a
  // trescientos metros), se lo pone a LLEGADA_M de la meta, del lado de donde venía, sobre tierra: la escena tardaba 8 minutos en ver llegar a Ramón o a Belisario.
  // (2) Si no avanza (agua en el medio, un tronco, la meta adentro de un obstáculo), a los 2 s rodea por un costado y, si a los 2 s siguientes sigue sin avanzar, llega de golpe: antes se
  // lo dejaba empujando contra el agua hasta el límite de tiempo del director (casi un minuto en una caminata de 40 m).
  const LEJOS_M = 50, LLEGADA_M = 34, ATASCO_S = 2;
  function acercarSiEstaLejos(n, d) {
    const dx = n.pos.x - d.x, dz = n.pos.z - d.z;
    if (!(Math.hypot(dx, dz) > LEJOS_M)) return;
    // 4.26.1 (B): ni el salto ni la llegada a la vista. Si la cámara lo ve allá lejos, camina hasta que deje de verlo (o hasta un corte); el punto de llegada es uno que
    // la cámara no ve (antes, el del lado de donde venía, aunque cayera en el cuadro: aparecía de golpe a 34 m)
    const v = vistaAhora(), c = entradaDe(n);
    const esperar = () => { if (c && !c.acercar) c.acercar = { x: d.x, z: d.z, t: 0, visto: 0, parpadeo: false }; };   // (se lo acerca en el próximo corte o cuando la cámara mire a otro lado: `acomodar`)
    if (v.seVe(n.pos.x, n.pos.y, n.pos.z)) { esperar(); return; }
    const base = Math.atan2(dx, dz);
    for (const g of [0, 0.4, -0.4, 0.8, -0.8, 1.2, -1.2, 1.6, -1.6, Math.PI, 2.0, -2.0, 2.4, -2.4, 2.8, -2.8]) {
      const x = d.x + Math.sin(base + g) * LLEGADA_M, z = d.z + Math.cos(base + g) * LLEGADA_M;
      if (v.seVe(x, num(ctx.T?.altura?.(x, z), n.pos.y), z)) continue;
      if (ctx.T?.agua?.(x, z)) continue;
      ubicar(n, { x, z }, null);
      anotarLlegada(n, '34 m' + (enDirector ? ' (director)' : ''));
      if (c) c.acercar = null;
      return;
    }
    esperar();
  }
  function vigilarPaseo(c, dt) {
    const p = c.paseo, n = c.n;
    if (!p) return;
    if (!n || !n.camino || !n.camino.length) { c.paseo = null; return; }
    p.t += dt;
    if (p.t < 1) return;
    p.t = 0;
    const d = Math.hypot(n.pos.x - p.x, n.pos.z - p.z);
    const avance = p.ref - d;
    p.ref = d;
    if (avance > 0.12) { p.malos = 0; return; }
    if (++p.malos < ATASCO_S) return;
    p.malos = 0;
    if (p.desvios < 1 && d > 1.2) {
      const a = Math.atan2(p.x - n.pos.x, p.z - n.pos.z) + 1.1;
      const q = { x: n.pos.x + Math.sin(a) * 5, z: n.pos.z + Math.cos(a) * 5 };
      p.desvios++;
      if (!ctx.T?.agua?.(q.x, q.z)) { n.camino = [{ x: q.x, z: q.z, cerca: 0.4 }, { x: p.x, z: p.z, cerca: 0.22 }]; p.ref = Infinity; }
      return;
    }
    c.paseo = null;
    llegarSinQueSeVea(c, { x: p.x, z: p.z }, null);   // (4.26.1 B: de golpe sólo donde la cámara no mira)
  }
  // 4.26.1 (B): lo que la cámara de la escena ve en este cuadro. Adentro del director (caminar, el límite de una caminata, el final de la escena) cuenta la pose del guion
  // que se va a poner en este cuadro y también la que se vio en el anterior; después (despuesDeGente), la que se puso. Un corte (un plano sin mezcla que empieza en este
  // cuadro) o la pantalla en negro tapan todo. Sin escena no hay cámara dirigida que cuidar (`seVe` siempre falso).
  let poseVista = null, cortesVistos = 0, corteCuadro = false, enDirector = false;
  const cortesDelDirector = () => num(director.cortes?.(), 0);
  const NADA_A_LA_VISTA = { seVe: () => false };
  const poseDeLaCamara = () => { const k = ctx.camara; return k?.position ? { x: k.position.x, y: k.position.y, z: k.position.z, yaw: num(k.rotation?.y), pitch: num(k.rotation?.x), fov: num(k.fov, 60) } : null; };
  function vistaAhora() {
    if (!director.activa()) return NADA_A_LA_VISTA;
    if (Math.max(num(director.fundido?.(), 0), nivelParpadeo()) >= VISTA_ESCENA.negro) return NADA_A_LA_VISTA;
    if (enDirector ? cortesDelDirector() !== cortesVistos : corteCuadro) return NADA_A_LA_VISTA;
    let q = null;
    if (enDirector) { try { q = director.camara(); } catch { q = null; } }
    const poses = [q, poseVista || (q ? null : poseDeLaCamara())].filter(Boolean);
    if (!poses.length) return NADA_A_LA_VISTA;
    const asp = num(ctx.camara?.aspect, 16 / 9);
    return { seVe: (x, y, z) => poses.some((p) => seVeDesde(p, x, y, z, asp)) };
  }
  const entradaDe = (n) => { for (const c of captura.values()) if (c.n === n && !c.alias) return c; return null; };
  // (QA: las últimas llegadas que se decidieron acá: quién, cómo y a qué hora de la escena; ver `llegadas()` abajo)
  const registroLlegadas = [];
  const anotarLlegada = (n, como) => { registroLlegadas.push({ quien: n?.clave, como, t: Math.round(num(director.__sesion?.()?.t, -1) * 100) / 100, corte: corteCuadro, negro: nivelParpadeo() }); if (registroLlegadas.length > 40) registroLlegadas.shift(); };
  const pieEn = (p, n) => (Number.isFinite(p.y) ? p.y : num(ctx.T?.altura?.(p.x, p.z), n.pos.y));
  // Lleva a alguien a `meta` de golpe sólo si la cámara no lo ve ni ve la meta (o en un corte, o con la pantalla en negro). Si no, se queda donde está (ya no camina: la
  // escena sigue) mirando hacia donde iba, y llega en el próximo corte o cuando la cámara mire para otro lado (`acomodar`); si a los ESPERA_CORTE s la cámara lo sigue
  // viendo, en un parpadeo. Al soltarlo, si no llegó, queda donde está.
  function llegarSinQueSeVea(c, meta, mira) {
    const n = c.n;
    if (!n) return;
    const v = vistaAhora();
    if (!v.seVe(n.pos.x, n.pos.y, n.pos.z) && !v.seVe(meta.x, pieEn(meta, n), meta.z)) { c.pendiente = null; ubicar(n, meta, mira); anotarLlegada(n, 'de golpe' + (enDirector ? ' (director)' : '')); return; }
    n.camino = []; n.vel = 0;
    const m = mira || meta;
    if (Math.hypot(m.x - n.pos.x, m.z - n.pos.z) > 0.05) { const r = Math.atan2(m.x - n.pos.x, m.z - n.pos.z); n.rumboObjetivo = r; n.miraFinal = r; }
    c.pendiente = { x: meta.x, z: meta.z, y: meta.y, mira: mira || null, visto: 0, parpadeo: false };
  }
  function acomodar(c, dt) {
    const n = c.n;
    if (!n) { c.pendiente = null; c.acercar = null; return; }
    if (c.pendiente) {
      const p = c.pendiente, v = vistaAhora();
      if (!v.seVe(n.pos.x, n.pos.y, n.pos.z) && !v.seVe(p.x, pieEn(p, n), p.z)) { c.pendiente = null; ubicar(n, p, p.mira); anotarLlegada(n, 'al dejar de verse'); }
      else if ((p.visto += dt) >= ESPERA_CORTE && !p.parpadeo) p.parpadeo = pedirParpadeo(() => { if (entradaDe(n) === c && c.pendiente === p) { c.pendiente = null; ubicar(n, p, p.mira); anotarLlegada(n, 'en un parpadeo'); } });
    }
    if (c.acercar) {
      const a = c.acercar;
      if (!n.camino?.length || !(Math.hypot(n.pos.x - a.x, n.pos.z - a.z) > LEJOS_M)) { c.acercar = null; return; }
      a.t += dt; a.visto += dt;
      if (a.t < 0.25) return;   // (cuatro veces por segundo)
      a.t = 0;
      const ya = () => {
        if (entradaDe(n) !== c || c.acercar !== a) return;   // (la escena terminó o ya llegó en el medio)
        const camino = n.camino;
        acercarSiEstaLejos(n, a);
        if (!c.acercar) { n.camino = camino; if (c.paseo) { c.paseo.ref = Math.hypot(n.pos.x - c.paseo.x, n.pos.z - c.paseo.z); c.paseo.malos = 0; } }
      };
      // la cámara lo sigue (o no deja de verlo) y la escena lo espera: un parpadeo a negro, una sola vez, y llega con la pantalla tapada
      if (a.visto >= ESPERA_CORTE && !a.parpadeo) { if ((a.parpadeo = pedirParpadeo(ya))) return; }
      ya();
    }
  }
  // 4.26.1 (B): el parpadeo: el velo de las escenas (el mismo del fundido; no dibuja nada nuevo) baja a negro en PARPADEO.baja s, a oscuras corre lo que se pidió y vuelve.
  // Lo que se pide mientras baja entra en el mismo parpadeo; si ya pasó lo oscuro, no (devuelve false y se vuelve a pedir después).
  const PARPADEO = { baja: 0.18, queda: 0.1, sube: 0.24 }, ESPERA_CORTE = 3;
  let parpadeo = null;
  function pedirParpadeo(accion) {
    if (!parpadeo) { parpadeo = { t: 0, hecho: false, acciones: [accion] }; return true; }
    if (!parpadeo.hecho) { parpadeo.acciones.push(accion); return true; }
    return false;
  }
  function nivelParpadeo() {
    const p = parpadeo, B = PARPADEO;
    if (!p) return 0;
    return p.t < B.baja ? p.t / B.baja : p.t < B.baja + B.queda ? 1 : Math.max(0, 1 - (p.t - B.baja - B.queda) / B.sube);
  }
  function avanzarParpadeo(dt) {
    const p = parpadeo;
    if (!p) return;
    p.t += dt;
    if (!p.hecho && p.t >= PARPADEO.baja) { p.hecho = true; for (const f of p.acciones) { try { f(); } catch (e) { ctx.fallo?.(e, 'escenas-parpadeo'); } } }
    if (p.t >= PARPADEO.baja + PARPADEO.queda + PARPADEO.sube) parpadeo = null;
  }
  function soltarTodos() { for (const k of [...captura.keys()]) soltar(k); }
  // 4.25.1 (B): un lugar donde alguien se PARA no puede ser adentro de un sólido (un árbol, una roca, la pared del galpón, el vagón parado en el andén, una pirca) ni en el agua.
  // Los guiones piden los lugares en coordenadas del mundo o corridos de un punto, y a veces caen adentro de algo; al caminar, el choque lo saca de a poco (y no llega), pero
  // `aparecer`, `teletransportar` (también el que hace el director al saltar la escena o al trabarse una caminata) lo dejaban metido. Se lo saca con el mismo choque de la gente
  // (radio 0,22: sólo si de verdad se solapa) y, si queda en el agua o todavía solapado, se busca el lugar libre más cercano en anillos de 0,4 m hasta 4 m.
  const RADIO_PUESTO = 0.22;
  const sonda = { x: 0, y: 0, z: 0 };
  function libreDeSolidos(x, z, y) {
    const col = ctx.col;
    if (!col?.resolver) return true;
    sonda.x = x; sonda.y = y; sonda.z = z;
    col.resolver(sonda, RADIO_PUESTO, 1.65);
    return Math.hypot(sonda.x - x, sonda.z - z) < 0.02;
  }
  function despejarPuesto(x, z, y) {
    const col = ctx.col, T = ctx.T;
    if (!Number.isFinite(x) || !Number.isFinite(z)) return { x, z };
    const agua = (a, b) => !!(T?.agua && T.agua(a, b));
    if (col?.resolver) {
      sonda.x = x; sonda.y = y; sonda.z = z;
      col.resolver(sonda, RADIO_PUESTO, 1.65);
      if (Math.hypot(sonda.x - x, sonda.z - z) < 0.02 && !agua(x, z)) return { x, z };
      if (!agua(sonda.x, sonda.z) && libreDeSolidos(sonda.x, sonda.z, y)) return { x: sonda.x, z: sonda.z };
    } else if (!agua(x, z)) return { x, z };
    for (let r = 0.4; r <= 4; r += 0.4) {
      const k = Math.max(8, Math.round(r * 10));
      for (let i = 0; i < k; i++) {
        const a = (i / k) * Math.PI * 2, qx = x + Math.cos(a) * r, qz = z + Math.sin(a) * r;
        if (!agua(qx, qz) && libreDeSolidos(qx, qz, y)) return { x: qx, z: qz };
      }
    }
    return { x, z };
  }
  function ubicar(n, p, mira) {
    // 4.18.0 (C): una altura pedida bien por encima de donde se pisa (el techo del galpón) se respeta; si no, el piso o el entablado de abajo
    let piso = alturaDePie(ctx.T, ctx.col, p.x, p.z, num(p.y));
    const alto = Number.isFinite(p.y) && p.y > piso + 1.2;
    // 4.25.1 (B): y nunca adentro de un sólido ni en el agua (ver `despejarPuesto`); arriba de un techo no hay con qué chocar
    if (!alto) { const q = despejarPuesto(p.x, p.z, piso); if (q.x !== p.x || q.z !== p.z) { p = { ...p, x: q.x, z: q.z }; piso = alturaDePie(ctx.T, ctx.col, p.x, p.z, num(p.y)); } }
    n.pos.set(p.x, alto ? p.y : piso, p.z);
    n.camino = []; n.vel = 0;
    if (mira) { const r = Math.atan2(mira.x - p.x, mira.z - p.z); n.rumboObjetivo = r; n.miraFinal = r; n.g.rotation.y = r; n.rumbo = r; }
  }

  // 4.26.2 (A): los puntos «adelante tuyo» de los guiones (`{ frente, dist, lado }`) cuando mirás a una pared, una roca o el bosque caían adentro o del otro lado y
  // `despejarPuesto` los dejaba adentro del galpón o detrás de la pared. Hasta 12 m (lo lejano, el volador a 40 m o el enjambre a 24 m, queda como estaba) el punto vale si
  // está libre y el tramo recto desde la base hasta él no cruza sólidos (muestras cada 0,5 m); si no, se gira el rumbo de la base en este orden hasta que valga. El giro
  // se guarda por escena y por base: todos los `frente` de la escena lo usan (se mantiene quién queda a la izquierda y para dónde mira la cámara) y se borra al cambiar de escena.
  const DIST_FRENTE_LIBRE = 12;
  const GIROS_FRENTE = [0, 30, -30, 60, -60, 90, -90, 120, -120, 150, -150, 180].map((g) => (g * Math.PI) / 180);
  let girosEscena = { id: null, giros: new Map() };
  function puntoValeFrente(b, p) {
    const T = ctx.T;
    const y = alturaDePie(T, ctx.col, p.x, p.z, 0);
    if (T?.agua && T.agua(p.x, p.z)) return false;
    if (!libreDeSolidos(p.x, p.z, y)) return false;
    const dx = p.x - b.x, dz = p.z - b.z, L = Math.hypot(dx, dz), k = Math.floor(L / 0.5);
    for (let i = 1; i <= k; i++) { const qx = b.x + (dx * i * 0.5) / L, qz = b.z + (dz * i * 0.5) / L; if (!libreDeSolidos(qx, qz, alturaDePie(T, ctx.col, qx, qz, 0))) return false; }
    return true;
  }
  function giroDelFrente(quien, b, punto) {
    const id = director.idActual?.() ?? null;
    if (girosEscena.id !== id) girosEscena = { id, giros: new Map() };
    if (id !== null && girosEscena.giros.has(quien)) return girosEscena.giros.get(quien);
    try {
      if (puntoValeFrente(b, punto(0))) return 0;
      for (const g of GIROS_FRENTE) if (g !== 0 && puntoValeFrente(b, punto(g))) { if (id !== null) girosEscena.giros.set(quien, g); return g; }
    } catch { /* sin mundo para mirar: el punto pedido */ }
    return 0;
  }

  // 4.17.0 (C): un lugar con nombre: los de la Historia (la raíz de Ramón, el coihue, tu molino, la cantera…: `ctx.puntos()`) y los del mundo (T.lugares)
  const lugarDe = (k) => {
    const p = ctx.puntos?.();
    if (p && typeof k === 'string' && Object.hasOwn(p, k) && Number.isFinite(p[k]?.x)) return p[k];
    return ctx.T?.lugares && typeof k === 'string' && Object.hasOwn(ctx.T.lugares, k) ? ctx.T.lugares[k] : null;
  };
  // ---- el mundo que ve el director
  const mundo = {
    puedeEmpezar: () => { try { return ctx.puedeEmpezar ? !!ctx.puedeEmpezar() : true; } catch { return false; } },
    posicion(ref) {
      const js = ctx.jugador().estado;
      if (ref === 'jugador') return { x: js.pos.x, y: js.pos.y, z: js.pos.z };
      if (typeof ref === 'string') {
        const n = actor(ref);
        if (n) return { x: n.pos.x, y: n.pos.y, z: n.pos.z };
        const l = lugarDe(ref);
        return l && Number.isFinite(l.x) ? { x: l.x, z: l.z } : null;
      }
      if (ref && typeof ref === 'object') {
        if (typeof ref.lugar === 'string') {
          const l = lugarDe(ref.lugar);
          if (!l || !Number.isFinite(l.x)) return null;
          let ox = num(ref.dx), oz = num(ref.dz);
          // 4.24.1: corrimientos en el marco del lugar, si trae `ang` (el andén de la estación): `lx` paralelo a la vía, `lz` alejándose de ella (como `aMundo` de la parada)
          if ((ref.lx !== undefined || ref.lz !== undefined) && Number.isFinite(l.ang)) { const lx = num(ref.lx), lz = num(ref.lz); ox += lx * Math.cos(l.ang) + lz * Math.sin(l.ang); oz += -lx * Math.sin(l.ang) + lz * Math.cos(l.ang); }
          const q = { x: l.x + ox, z: l.z + oz };
          // 4.18.0 (C): `techo: true` = arriba de la cumbrera de tu galponcito (Fermín con la honda); sin galponcito, en el suelo
          if (ref.techo === true && (ref.lugar === 'galpon-noche' || ref.lugar === 'galpon-propio') && lugarDe('galpon-propio') && ctx.T?.altura) q.y = ctx.T.altura(q.x, q.z) + CUMBRERA_GALPONCITO;
          return q;
        }
        // 4.26.4 (A): `{ grupo: 'centro' | 'jefe', lado }`: el centro (o el Mandamás) del grupo de duendes que puso la escena, con un corrimiento `lado` de costado visto desde vos; sin grupo todavía,
        // el punto de siempre adelante tuyo (galpon-encuentro: los planos miran a la gente, esté donde esté: afuera del galponcito, girada por una pared, etc.)
        if (typeof ref.grupo === 'string') {
          const g = (() => { try { return ctx.grupoDuendes?.(ref.grupo) || null; } catch { return null; } })();
          const b = g && Number.isFinite(g.x) && Number.isFinite(g.z) ? g : mundo.posicion({ frente: 'jugador', dist: 6.5 });
          if (!b) return null;
          const l = num(ref.lado);
          if (!l) return { x: b.x, z: b.z };
          const dx = b.x - js.pos.x, dz = b.z - js.pos.z, L = Math.hypot(dx, dz) || 1;
          return { x: b.x + (-dz / L) * l, z: b.z + (dx / L) * l };
        }
        if (typeof ref.frente === 'string') {
          let b;
          if (ref.frente === 'jugador') b = { x: js.pos.x, z: js.pos.z, fx: -Math.sin(js.yaw), fz: -Math.cos(js.yaw) };
          else { const n = actor(ref.frente); if (!n) return null; b = { x: n.pos.x, z: n.pos.z, fx: Math.sin(n.g.rotation.y), fz: Math.cos(n.g.rotation.y) }; }
          const d = num(ref.dist, 3), l = num(ref.lado);
          const punto = (g) => { const c = Math.cos(g), s = Math.sin(g), fx = b.fx * c - b.fz * s, fz = b.fx * s + b.fz * c; return { x: b.x + fx * d + -fz * l, z: b.z + fz * d + fx * l }; };
          // 4.26.2 (A): lo cercano (hasta 12 m) no cae adentro de lo que tenés enfrente: ver `giroDelFrente`
          if (d <= DIST_FRENTE_LIBRE) { const g = giroDelFrente(ref.frente, b, punto); if (g !== 0) return punto(g); }
          return punto(0);
        }
      }
      return null;
    },
    suelo: (x, z) => alturaDePie(ctx.T, ctx.col, x, z, 0),
    camaraJugador() {
      const c = ctx.camara, a = ctx.ajustes?.();
      return { x: c.position.x, y: c.position.y, z: c.position.z, yaw: c.rotation.y, pitch: c.rotation.x, fov: num(a?.fov, 70) };
    },
    horaActual: () => num(ctx.progreso().horas, 12),
    hora(h, info) {
      // 4.17.1: con «la hora de tu reloj» la escena no toca la hora: manda la de la PC (al cuadro siguiente la pisaba igual, y el salto
      // contaba como medianoche: sumaba días de más)
      if (ctx.ajustes?.()?.duracion === 'reloj') return;
      const p = ctx.progreso();
      const antes = num(p.horas, 12);
      p.horas = ((h % 24) + 24) % 24;
      // pasó la medianoche: con `delta` (4.17.1: el corte o la escena salteada, de una vez) si fue hacia adelante y la hora quedó antes;
      // sin él (el paso a paso de la hora con duración), si bajó más de 12 h
      const d = Number(info?.delta);
      const cruzo = Number.isFinite(d) ? d > 0 && p.horas < antes : antes - p.horas > 12;
      if (cruzo) p.dia = Math.floor(num(p.dia, 1)) + 1;
    },
    clima(nombre, dur) {
      const e = ctx.clima?.()?.estado;
      if (!e || !['despejado', 'nublado', 'lluvia'].includes(nombre)) return;
      e.objetivo = nombre; e.proximo = nombre; e.t = Math.max(num(e.t), 600);
    },
    sonido(id, p) {
      const s = ctx.sonido;
      const c = ctx.camara.position;
      const pos = p?.en !== undefined ? (mundo.posicion(p.en) || c) : c;
      const tabla = { campana: () => s.campana(pos), portazo: () => s.portazo(pos), bisagra: () => s.bisagra(pos), anotar: () => s.anotar(), juntar: () => s.juntar() };
      if (Object.hasOwn(tabla, id)) { try { tabla[id](); } catch { /* el sonido nunca frena una escena */ } }
    },
    capturar,
    soltar,
    caminar(clave, d, o) {
      const c = toma(clave); if (!c?.n) return;
      const n = c.n;
      acercarSiEstaLejos(n, d);
      c.paseo = { x: d.x, z: d.z, ref: Math.hypot(n.pos.x - d.x, n.pos.z - d.z), t: 0, malos: 0, desvios: 0 };
      n.velocidad = num(o?.vel, 1.4);
      // 4.25.1 (B): la meta de una caminata tampoco puede ser adentro de un sólido (se frenaba contra el borde sin llegar nunca y el director lo plantaba adentro al trabarse)
      let meta = { x: d.x, z: d.z };
      try { if (!(Number.isFinite(d.y) && d.y > alturaDePie(ctx.T, ctx.col, d.x, d.z, num(d.y)) + 1.2)) meta = despejarPuesto(d.x, d.z, alturaDePie(ctx.T, ctx.col, d.x, d.z, n.pos.y)); } catch { /* sin mundo para mirar: la meta pedida */ }
      n.camino = [{ x: meta.x, z: meta.z, cerca: 0.22 }];
      if (o?.mira) n.miraFinal = Math.atan2(o.mira.x - d.x, o.mira.z - d.z); else delete n.miraFinal;
    },
    ocupado(clave) { const c = toma(clave); return !!c?.n && !!c.n.camino && c.n.camino.length > 0; },
    mirar(clave, p, instante) {
      const c = toma(clave); if (!c?.n) return;
      const n = c.n, r = Math.atan2(p.x - n.pos.x, p.z - n.pos.z);
      n.miraFinal = r; n.rumboObjetivo = r;
      if (instante) { n.g.rotation.y = r; n.rumbo = r; }
    },
    posar(clave, pose, dur) {
      const c = toma(clave); if (!c?.n) return;
      const n = c.n;
      limpiarPose(c);
      // 4.18.0 (C): «sentado» es una pose de base (Ramón en cama, con la manta): queda sentado toda la escena y los gestos de brazos y cabeza
      // se hacen sentado; los del juego que ocupan el cuerpo entero (tocar, palear…) no lo levantan. «parado» lo levanta.
      if (pose === 'sentado') { c.base = 'sentado'; n.pose = 'sentado'; n.asiento = 0.47; return; }
      if (pose === 'parado') { c.base = null; if (n.pose === 'sentado') n.pose = null; n.asiento = undefined; return; }
      if (!pose || dur <= 0) return;
      c.pose = { nombre: pose, t: 0, dur };
      if (POSES_DEL_JUEGO.has(pose) && !c.base) n.pose = pose;
      else if (POSES_QUIETUD.has(pose)) n.__quietud = pose;
      if (OCUPAN_LA_MANO.has(pose)) guardarObjetos(c);
    },
    aparecer(clave, p, mira) { const c = toma(clave); if (!c?.n) return; c.n.dormido = false; c.n.g.visible = true; ubicar(c.n, p, mira); },
    desaparecer(clave) { const c = toma(clave); if (!c?.n) return; c.n.dormido = true; c.n.g.visible = false; },
    teletransportar(clave, p, mira) {
      const c = toma(clave); if (!c?.n) return;
      // 4.26.1 (B): el director lleva a la meta al que no llegó (pasado el tiempo de la caminata, o al terminar la escena): eso no se hace a la vista. Al saltar la escena
      // (Esc) sí, como siempre: cambia todo de golpe igual
      if (director.corriendo() && !director.saltando() && Math.hypot(c.n.pos.x - p.x, c.n.pos.z - p.z) > 0.6) { llegarSinQueSeVea(c, p, mira); return; }
      c.pendiente = null;
      ubicar(c.n, p, mira);
    },
    alEmpezar() { empezarVista(); try { ctx.alEmpezar?.(); } catch (e) { ctx.fallo?.(e, 'escenas-empezar'); } },
    alTerminar(r) { soltarTodos(); terminarVista(); try { ctx.alTerminar?.(r); } catch (e) { ctx.fallo?.(e, 'escenas-terminar'); } },
  };
  // 4.25.1 (C): lo que se lleva en la mano (la planilla, la caña) no acompaña a los gestos de brazos cruzados, a la cintura, atrás, etc.: la tabla asomaba por la espalda y el hombro.
  // Se guarda mientras dura la pose y se devuelve al terminarla (o al soltar al personaje, aunque la escena se corte).
  function guardarObjetos(c) {
    c.guardados ||= [];
    for (const k of OBJETOS_EN_MANO) { const o = c.n?.[k]; if (o && o.visible !== false) { o.visible = false; c.guardados.push(k); } }
  }
  function devolverObjetos(c) {
    if (!c?.guardados?.length) return;
    for (const k of c.guardados) { const o = c.n?.[k]; if (o) o.visible = true; }
    c.guardados = [];
  }
  function limpiarPose(c) {
    if (c) devolverObjetos(c);
    if (!c.pose || !c.n) { if (c) c.pose = null; return; }
    const n = c.n, p = c.pose.nombre;
    if (POSES_DEL_JUEGO.has(p) && n.pose === p) n.pose = null;
    if (POSES_QUIETUD.has(p)) n.__quietud = null;
    c.pose = null;
  }

  // ---- el director
  const director = crearDirector({
    mundo,
    estado: () => { const h = ctx.progreso().historia; return h && typeof h === 'object' && !Array.isArray(h) ? escenasDe(h) : sinHistoria; },
    dia: () => ctx.progreso().dia,
    alError: (t) => ctx.fallo?.(new Error(t), 'escenas'),
  });

  // ---- la pantalla (se arma la primera vez que hace falta)
  function armarDom() {
    if (dom) return dom;
    const estilo = doc.createElement('style');
    estilo.textContent = CSS_ESCENAS;
    doc.head.appendChild(estilo);
    const crear = (tag, id, cls, padre = doc.body) => { const e = doc.createElement(tag); if (id) e.id = id; if (cls) e.className = cls; padre.appendChild(e); return e; };
    const capa = crear('div', 'escena-capa');
    crear('div', null, 'escena-barra arriba');
    crear('div', null, 'escena-barra abajo');
    const caja = crear('div', 'escena-dialogo');
    caja.setAttribute('role', 'dialog');
    caja.innerHTML = '<div class="quien"></div><div class="texto"></div><div class="sigue">Enter ▾</div><div class="opciones"></div>';
    const velo = crear('div', 'escena-velo');
    const pie = crear('div', 'escena-pie');
    pie.textContent = 'Enter o Espacio: seguir · Esc: saltar la escena · F1: pausa';
    const aviso = crear('div', 'escena-aviso');
    aviso.textContent = 'Apretá Esc otra vez para saltar la escena';
    dom = { capa, caja, quien: caja.querySelector('.quien'), texto: caja.querySelector('.texto'), opciones: caja.querySelector('.opciones'), velo, pie, aviso, cache: {} };
    // 4.17.1: los clics cuentan sólo jugando (con la pausa abierta, un clic avanzaba el diálogo o elegía la opción marcada), y uno sobre
    // una opción, pasado el margen de la elección (un clic de más no elige apenas aparece)
    const enJuego = () => ctx.modo() === 'jugando';
    capa.addEventListener('click', () => { if (enJuego() && director.corriendo()) director.avanzar(); });
    caja.addEventListener('click', (e) => {
      if (!enJuego()) return;
      const b = e.target.closest?.('button[data-i]');
      if (b) { if (director.eleccionLista()) director.elegir(Number(b.dataset.i)); return; }
      if (director.corriendo()) director.avanzar();
    });
    return dom;
  }
  function empezarVista() {
    poseVista = poseDeLaCamara(); cortesVistos = cortesDelDirector(); corteCuadro = false; parpadeo = null;   // (4.26.1 B: la escena arranca con lo que veías)
    armarDom();
    dom.capa.classList.add('activa');
    doc.body.classList.remove('escena-saliendo');
    doc.body.classList.add('escena-en-curso');
    try { const j = ctx.jugador(); j.estado.zoom = false; j.soltar(); } catch { /* sin mouse bloqueado */ }
  }
  // 4.17.1: la pausa, la guía, el cuaderno o la portada encima de una escena: la escena se esconde y no recibe clics (main.js la llama en
  // cada cuadro con «¿se está jugando?»; sólo toca el DOM cuando cambia)
  let tapada = false;
  function tapar(si) {
    si = !!si && director.activa();
    if (si === tapada) return;
    tapada = si;
    doc.body.classList.toggle('escena-tapada', si);
  }
  function terminarVista() {
    poseVista = null; corteCuadro = false; parpadeo = null;
    if (!dom) return;
    dom.capa.classList.remove('activa');
    doc.body.classList.remove('escena-en-curso', 'escena-saliendo');
    dom.caja.classList.remove('visible', 'completo', 'con-opciones');
    dom.aviso.classList.remove('visible');
    dom.velo.style.opacity = '0';
    dom.cache = {};
  }
  function pintar() {
    const d = director.datos();
    if (!d || !dom) return;
    const c = dom.cache;
    // las barras se van durante la salida
    const saliendo = d.fase === 'saliendo';
    if (c.saliendo !== saliendo) { c.saliendo = saliendo; doc.body.classList.toggle('escena-saliendo', saliendo); doc.body.classList.toggle('escena-en-curso', !saliendo); dom.capa.classList.toggle('activa', !saliendo); }
    const v = String(Math.round(Math.max(d.fundido, nivelParpadeo()) * 100) / 100);   // (4.26.1 B: y el parpadeo)
    if (c.velo !== v) { c.velo = v; dom.velo.style.opacity = v; }
    const dl = d.dialogo, el = d.eleccion;
    const visible = !!(dl || el);
    if (c.visible !== visible) { c.visible = visible; dom.caja.classList.toggle('visible', visible); }
    if (dl) {
      if (c.quien !== dl.nombre + dl.color) { c.quien = dl.nombre + dl.color; dom.quien.textContent = dl.nombre; dom.quien.style.color = dl.color; dom.quien.style.display = dl.nombre ? '' : 'none'; }
      if (c.texto !== dl.texto) { c.texto = dl.texto; dom.texto.textContent = dl.texto; }
      if (c.completo !== dl.completo) { c.completo = dl.completo; dom.caja.classList.toggle('completo', dl.completo); }
      if (c.con) { c.con = false; dom.caja.classList.remove('con-opciones'); }
    } else if (el) {
      if (c.quien !== 'pregunta') { c.quien = 'pregunta'; dom.quien.textContent = ''; dom.quien.style.display = 'none'; }
      const t = el.pregunta;
      if (c.texto !== t) { c.texto = t; dom.texto.textContent = t; }
      const clave = el.id + el.opciones.map((o) => o.id).join(',');
      if (c.eleccion !== clave) {
        c.eleccion = clave; c.con = true;
        dom.caja.classList.add('con-opciones'); dom.caja.classList.remove('completo');
        dom.opciones.innerHTML = el.opciones.map((o, i) => `<button type="button" data-i="${i}"><kbd>${i + 1}</kbd><span>${esc(o.texto)}</span></button>`).join('');
      }
      if (c.indice !== el.indice) { c.indice = el.indice; [...dom.opciones.children].forEach((b, i) => b.setAttribute('aria-selected', i === el.indice ? 'true' : 'false')); }
    }
    if (!el && c.eleccion) c.eleccion = null;
    if (c.confirmar !== d.confirmar) { c.confirmar = d.confirmar; dom.aviso.classList.toggle('visible', d.confirmar); }
    if (d.resumen && c.resumen !== d.resumen) { c.resumen = d.resumen; ctx.nota?.('Escena saltada', d.resumen); }
  }

  // ---- la cámara
  // 4.17.0 (C): la cámara dirigida no se mete adentro de un árbol, un muro o una roca. Del foco (a lo que mira) hacia la cámara se camina de a 0,3 m con
  // una bolita de 0,3 m de radio; en el primer choque la cámara se queda un poco antes (nunca a menos de 1,3 m del foco). Si el paso libre se achica la cámara
  // se acerca de golpe (para no ver el interior del tronco); si se agranda, vuelve despacio. Y nunca por debajo del suelo.
  const DESPEJE = { paso: 0.3, radio: 0.3, minimo: 1.3, margen: 0.25, bajo: 0.45, bajoLejos: 1.3, lejos: 5 };   // (bajoLejos: los planos a 5 m o más no van por debajo de 1,3 m del suelo: el pasto alto y los helechos tapaban la lente)
  const bola = { x: 0, y: 0, z: 0 };
  let brazo = { id: null, k: 1 };
  function despejarCamara(c, dt, id) {
    const f = c.foco, col = ctx.col;
    if (!f || !col?.resolver) {   // 4.18.4: sin foco (la salida de la escena, un plano `sinDespeje`) igual no se baja del terreno
      const s0 = ctx.T?.altura ? ctx.T.altura(c.x, c.z) : null;
      return Number.isFinite(s0) && c.y < s0 + DESPEJE.bajo ? { ...c, y: s0 + DESPEJE.bajo } : c;
    }
    let dx = c.x - f.x, dy = c.y - f.y, dz = c.z - f.z;
    const L = Math.hypot(dx, dy, dz);
    let k = 1;
    if (L > DESPEJE.minimo) {
      const ux = dx / L, uy = dy / L, uz = dz / L;
      // 4.26.1 (B): si el foco mismo cae adentro de un sólido (un punto «adelante tuyo» adentro de la pared del galpón, de una roca, del tocón), ese sólido no está ENTRE
      // la lente y el foco: se lo saltea hasta el primer tramo libre. Antes chocaba en la primera muestra, la lente iba a 1,3 m del foco (adentro del mismo sólido) y el
      // empujón de costado la dejaba pegada a la pared o a la roca, que tapaba el cuadro (galpon-encuentro, coihue-talado, fiesta-nieve, en la partida real)
      bola.x = f.x; bola.y = f.y - 0.45; bola.z = f.z;
      col.resolver(bola, 0.1, 0.7);   // (el foco mismo adentro: con 0,1 m; un foco que sólo está cerca de un tronco o una pared sigue como siempre)
      let libreYa = !(Math.hypot(bola.x - f.x, bola.z - f.z) > 0.02);
      for (let s = DESPEJE.minimo; s <= L; s += DESPEJE.paso) {
        bola.x = f.x + ux * s; bola.y = f.y + uy * s - 0.45; bola.z = f.z + uz * s;
        const x0 = bola.x, z0 = bola.z;
        col.resolver(bola, DESPEJE.radio, 0.7);
        const choca = Math.hypot(bola.x - x0, bola.z - z0) > 0.02;
        if (!choca) { libreYa = true; continue; }
        if (libreYa) { k = Math.max(DESPEJE.minimo, s - DESPEJE.paso - DESPEJE.margen) / L; break; }
      }
    }
    if (brazo.id !== id) brazo = { id, k };
    brazo.k = k < brazo.k ? k : Math.min(k, brazo.k + (k - brazo.k) * Math.min(1, dt * 2.5));
    const r = { ...c };
    if (brazo.k < 0.999) { r.x = f.x + dx * brazo.k; r.y = f.y + dy * brazo.k; r.z = f.z + dz * brazo.k; }
    const suelo = ctx.T?.altura ? ctx.T.altura(r.x, r.z) : null;
    const piso = (L >= DESPEJE.lejos ? DESPEJE.bajoLejos : DESPEJE.bajo);
    if (Number.isFinite(suelo) && r.y < suelo + piso) r.y = suelo + piso;
    // 4.25.1 (B): la lente misma nunca queda adentro de un sólido (el tronco del coihue, la pared del galpón, un tablón): el barrido de 0,3 m de arriba arranca a 1,3 m del foco y
    // no ve lo que hay pegado al foco; se la saca por el costado con el mismo choque (radio 0,25)
    bola.x = r.x; bola.y = r.y - 0.45; bola.z = r.z;
    col.resolver(bola, 0.25, 0.7);
    if (Math.hypot(bola.x - r.x, bola.z - r.z) > 0.02) { r.x = bola.x; r.z = bola.z; }
    if (r.x !== c.x || r.y !== c.y || r.z !== c.z) {
      dx = f.x - r.x; dy = f.y - r.y; dz = f.z - r.z;
      r.yaw = Math.atan2(-dx, -dz); r.pitch = Math.atan2(dy, Math.hypot(dx, dz));
    }
    return r;
  }
  function aplicarCamara(dt = 0.016) {
    // 4.26.1 (B): ¿empezó un plano sin mezcla en este cuadro? (un corte: ahí se puede acomodar a alguien sin que se note)
    const k = cortesDelDirector();
    corteCuadro = k !== cortesVistos; cortesVistos = k;
    let c = director.camara();
    if (!c) { poseVista = null; return; }
    try { c = despejarCamara(c, dt, director.idActual?.()); } catch (e) { ctx.fallo?.(e, 'escenas-camara'); }
    const cam = ctx.camara;
    cam.position.set(c.x, c.y, c.z);
    cam.rotation.set(c.pitch, c.yaw, 0, 'YXZ');
    if (Math.abs(cam.fov - c.fov) > 0.01) { cam.fov = c.fov; cam.updateProjectionMatrix(); }
    cam.updateMatrixWorld();
    poseVista = { x: c.x, y: c.y, z: c.z, yaw: c.yaw, pitch: c.pitch, fov: c.fov };   // 4.26.1 (B): la pose que se ve en este cuadro
  }

  // ---- por cuadro
  // Se llama en main.js con modo 'jugando', justo después de jugador.actualizar (la cámara del jugador ya está puesta).
  function actualizar(dt) {
    if (!director.activa()) {
      if (pendiente && ctx.modo() === 'jugando') { const id = pendiente; pendiente = null; if (!disparar(id, { forzar: true })) ctx.nota?.('No es el momento', 'Probá de nuevo cuando estés a pie y sin nada abierto'); }
      else if (mirada.activa()) pasoMirada(dt);
      return;
    }
    // el mouse queda suelto en toda la escena (volver de la pausa lo bloqueaba)
    if (doc?.pointerLockElement) { try { ctx.jugador().soltar(); } catch { /* ya */ } }
    try { avanzarParpadeo(dt); } catch (e) { ctx.fallo?.(e, 'escenas-parpadeo'); parpadeo = null; }   // (4.26.1 B)
    enDirector = true;   // (4.26.1 B: lo que mueva el director en este cuadro se mide contra la cámara que se va a poner)
    try { director.actualizar(dt); } catch (e) { ctx.fallo?.(e, 'escenas'); director.saltar(); } finally { enDirector = false; }
    aplicarCamara(dt);
    pintar();
  }
  // Después de gente.actualizar: las poses propias de las escenas
  function despuesDeGente(dt) {
    if (!captura.size) return;
    for (const [clave, c] of captura) {
      if (c.paseo) { try { vigilarPaseo(c, dt); } catch (e) { ctx.fallo?.(e, 'escenas-paseo'); } }
      if (c.pendiente || c.acercar) { try { acomodar(c, dt); } catch (e) { ctx.fallo?.(e, 'escenas-acomodar'); } }   // 4.26.1 (B): el que espera un corte para llegar
      if (!c.n || !c.pose) continue;
      c.pose.t += dt;
      const p = c.pose;
      if (p.t >= p.dur) { limpiarPose(c); continue; }
      const f = Object.hasOwn(POSES_PROPIAS, p.nombre) ? POSES_PROPIAS[p.nombre] : null;
      if (!f) continue;
      const w = suave(Math.min(p.t / 0.35, (p.dur - p.t) / 0.35, 1));
      try { f(c.n, p.t, w); } catch (e) { ctx.fallo?.(e, 'escenas-pose'); }
    }
  }
  function pasoMirada(dt) {
    const js = ctx.jugador().estado;
    const r = mirada.paso(dt);
    if (!r) return;
    js.yaw = r.yaw; js.pitch = r.pitch;
  }

  // ---- teclas y mouse (main.js llama primero a esto)
  function tecla(e) {
    if (!director.activa()) return false;
    const k = e.code;
    if (k === 'F1') return false;   // la pausa pasa (la escena queda congelada)
    if (director.fase() !== 'corriendo') { e.preventDefault?.(); return true; }
    if (k === 'Escape' || k === 'Tab') { e.preventDefault?.(); director.pedirSaltar(); pintar(); return true; }
    if (k === 'Enter' || k === 'NumpadEnter' || k === 'Space') { e.preventDefault?.(); director.avanzar(); return true; }
    const n = /^(?:Digit|Numpad)([1-4])$/.exec(k);
    if (n) { director.elegir(Number(n[1]) - 1); return true; }
    if (k === 'ArrowUp' || k === 'ArrowLeft' || k === 'KeyW' || k === 'KeyA') { director.moverEleccion(-1); return true; }
    if (k === 'ArrowDown' || k === 'ArrowRight' || k === 'KeyS' || k === 'KeyD') { director.moverEleccion(1); return true; }
    if (k === 'ShiftLeft' || k === 'ShiftRight') { director.acelerar(true); return true; }
    e.preventDefault?.();
    return true;
  }
  function teclaSuelta(e) {
    if (!director.activa()) return false;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') director.acelerar(false);
    return false;
  }

  // ---- disparar
  function registrarDemo() { return director.registrar(ESCENA_DEMO); }
  director.registrarEfecto('demo-nota', (a) => ctx.nota?.(a?.titulo || 'Escena', a?.texto || ''));
  function disparar(id, o) {
    if (ctx.modo() !== 'jugando') return false;
    if (id === ID_ESCENA_DEMO && !director.hay(id)) registrarDemo();
    return director.disparar(id, o);
  }
  function mirarA(ref, dur = 2.6) {
    const js = ctx.jugador().estado, p = mundo.posicion(ref);
    if (!p || director.activa()) return false;
    const c = ctx.camara.position;
    const dx = p.x - c.x, dz = p.z - c.z, dy = (Number.isFinite(p.y) ? p.y + 1.2 : c.y) - c.y;
    return mirada.iniciar({ yaw: js.yaw, pitch: js.pitch }, { yaw: Math.atan2(-dx, -dz), pitch: acotar(Math.atan2(dy, Math.hypot(dx, dz)), -1.2, 1.2) }, dur);
  }

  return {
    director, mundo, actualizar, despuesDeGente, tecla, teclaSuelta, disparar, mirarA, tapar,
    registrar: (e) => director.registrar(e),
    registrarEfecto: (n, f) => director.registrarEfecto(n, f),
    registrarCondicion: (n, f) => director.registrarCondicion(n, f),
    pedir: (id) => { pendiente = id; return true; },
    hayPendiente: () => !!pendiente,
    saltar: () => director.saltar(),
    // para main.js: guardar() no escribe mientras corre una escena (queda pendiente), y salir de la partida la termina antes
    activa: () => director.activa(),
    corriendo: () => director.corriendo(),
    cerrar: () => { if (director.activa()) { if (director.corriendo()) director.saltar(); else { /* ya saliendo: se completa solo */ } return true; } return false; },
    capturados: () => [...captura.keys()],
    llegadas: (limpiar = false) => { const r = registroLlegadas.slice(); if (limpiar) registroLlegadas.length = 0; return r; },   // 4.26.1 (B): QA (la partida real de prueba)
    parpadeo: () => nivelParpadeo(),   // 4.26.1 (B): cuánto tapa el parpadeo ahora (0 a 1; para las pruebas)
    mirando: () => mirada.activa(),
    PERSONAJES_BASE,
  };
}
