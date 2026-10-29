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

// Las poses que se hacen acá (el juego no las tiene): se aplican después de gente.actualizar, mezcladas con lo que ya hizo.
// Cada brazo: x (adelante, negativo), z (abrirlo; en el brazo 1, positivo es hacia afuera) y el codo (negativo, doblado).
const mezclar = (o, k, v, w) => { o[k] += (v - o[k]) * w; };
const POSES_PROPIAS = {
  saludo: (g, t, w) => {
    const b = g.brazos[1], cd = b.userData.codo;
    const o = Math.sin(t * 8.5);
    mezclar(b.rotation, 'x', -2.5, w); mezclar(b.rotation, 'z', 0.42 + o * 0.22, w);
    if (cd) mezclar(cd.rotation, 'x', -0.55 + o * 0.2, w);
    g.cabeza.rotation.y += Math.sin(t * 1.4) * 0.05 * w;
  },
  senalar: (g, t, w) => {
    const b = g.brazos[1], cd = b.userData.codo;
    mezclar(b.rotation, 'x', -1.5, w); mezclar(b.rotation, 'z', 0.1, w);
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
  },
};
// las que ya trae el juego en `g.pose` (gente.js) y en la quietud (gente-cuerpo.js)
const POSES_DEL_JUEGO = new Set(['mirar', 'aplaudir', 'contar', 'brindar', 'tocar', 'palear', 'hachar', 'regar', 'martillar', 'serruchar', 'bailar']);
const POSES_QUIETUD = new Set(['cruzados', 'cintura', 'barba', 'gorro', 'atras', 'delantal', 'juntas']);

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
    for (const n of lista) if (n.clave === clave) return n;
    return null;
  };
  function capturar(clave) {
    if (!clave || captura.has(clave)) return;
    const n = actor(clave);
    if (!n) { captura.set(clave, { n: null }); return; }
    const guardado = {};
    for (const k of ['conVos', 'enCita', 'pose', 'asiento', 'soloCerca', 'dormido', 'charlaVecinos', 'sinFrenar', 'camino', 'velocidad', 'miraFinal', '__quietud', 'alAmor', 'aBordo', 'enViaje']) guardado[k] = { tiene: Object.hasOwn(n, k), v: n[k] };
    captura.set(clave, { n, guardado, propia: null, pose: null });
    n.conVos = true; n.enCita = true; n.pose = null; n.asiento = undefined; n.soloCerca = 0; n.dormido = false; n.charlaVecinos = false; n.sinFrenar = true;
    n.aBordo = false; n.enViaje = false;   // 4.16.0: Elsa (la guarda) vive «a bordo» de la trochita y no se dibuja fuera de ella: en una escena sí
    n.camino = []; n.__quietud = null; n.alAmor = false;
    delete n.miraFinal;
  }
  function soltar(clave) {
    const c = captura.get(clave);
    if (!c) return;
    captura.delete(clave);
    const n = c.n;
    if (!n) return;
    for (const [k, o] of Object.entries(c.guardado)) { if (o.tiene && o.v !== undefined) n[k] = o.v; else delete n[k]; }
    n.camino = c.guardado.camino.tiene ? c.guardado.camino.v : undefined;
    n.vel = 0;
    if (n.g?.visible === false && !n.dormido) n.g.visible = true;
  }
  function soltarTodos() { for (const k of [...captura.keys()]) soltar(k); }
  function ubicar(n, p, mira) {
    n.pos.set(p.x, alturaDePie(ctx.T, ctx.col, p.x, p.z, num(p.y)), p.z);
    n.camino = []; n.vel = 0;
    if (mira) { const r = Math.atan2(mira.x - p.x, mira.z - p.z); n.rumboObjetivo = r; n.miraFinal = r; n.g.rotation.y = r; n.rumbo = r; }
  }

  // ---- el mundo que ve el director
  const mundo = {
    puedeEmpezar: () => { try { return ctx.puedeEmpezar ? !!ctx.puedeEmpezar() : true; } catch { return false; } },
    posicion(ref) {
      const js = ctx.jugador().estado;
      if (ref === 'jugador') return { x: js.pos.x, y: js.pos.y, z: js.pos.z };
      if (typeof ref === 'string') {
        const n = actor(ref);
        if (n) return { x: n.pos.x, y: n.pos.y, z: n.pos.z };
        const l = ctx.T?.lugares && Object.hasOwn(ctx.T.lugares, ref) ? ctx.T.lugares[ref] : null;
        return l && Number.isFinite(l.x) ? { x: l.x, z: l.z } : null;
      }
      if (ref && typeof ref === 'object') {
        if (typeof ref.lugar === 'string') {
          const l = ctx.T?.lugares && Object.hasOwn(ctx.T.lugares, ref.lugar) ? ctx.T.lugares[ref.lugar] : null;
          return l && Number.isFinite(l.x) ? { x: l.x + num(ref.dx), z: l.z + num(ref.dz) } : null;
        }
        if (typeof ref.frente === 'string') {
          let b;
          if (ref.frente === 'jugador') b = { x: js.pos.x, z: js.pos.z, fx: -Math.sin(js.yaw), fz: -Math.cos(js.yaw) };
          else { const n = actor(ref.frente); if (!n) return null; b = { x: n.pos.x, z: n.pos.z, fx: Math.sin(n.g.rotation.y), fz: Math.cos(n.g.rotation.y) }; }
          const d = num(ref.dist, 3), l = num(ref.lado);
          return { x: b.x + b.fx * d + -b.fz * l, z: b.z + b.fz * d + b.fx * l };
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
    hora(h) {
      const p = ctx.progreso();
      const antes = num(p.horas, 12);
      p.horas = ((h % 24) + 24) % 24;
      if (antes - p.horas > 12) p.dia = Math.floor(num(p.dia, 1)) + 1;   // pasó la medianoche
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
      const c = captura.get(clave); if (!c?.n) return;
      const n = c.n;
      n.velocidad = num(o?.vel, 1.4);
      n.camino = [{ x: d.x, z: d.z, cerca: 0.22 }];
      if (o?.mira) n.miraFinal = Math.atan2(o.mira.x - d.x, o.mira.z - d.z); else delete n.miraFinal;
    },
    ocupado(clave) { const c = captura.get(clave); return !!c?.n && !!c.n.camino && c.n.camino.length > 0; },
    mirar(clave, p, instante) {
      const c = captura.get(clave); if (!c?.n) return;
      const n = c.n, r = Math.atan2(p.x - n.pos.x, p.z - n.pos.z);
      n.miraFinal = r; n.rumboObjetivo = r;
      if (instante) { n.g.rotation.y = r; n.rumbo = r; }
    },
    posar(clave, pose, dur) {
      const c = captura.get(clave); if (!c?.n) return;
      const n = c.n;
      limpiarPose(c);
      if (!pose || dur <= 0) return;
      c.pose = { nombre: pose, t: 0, dur };
      if (POSES_DEL_JUEGO.has(pose)) n.pose = pose;
      else if (POSES_QUIETUD.has(pose)) n.__quietud = pose;
    },
    aparecer(clave, p, mira) { const c = captura.get(clave); if (!c?.n) return; c.n.dormido = false; c.n.g.visible = true; ubicar(c.n, p, mira); },
    desaparecer(clave) { const c = captura.get(clave); if (!c?.n) return; c.n.dormido = true; c.n.g.visible = false; },
    teletransportar(clave, p, mira) { const c = captura.get(clave); if (!c?.n) return; ubicar(c.n, p, mira); },
    alEmpezar() { empezarVista(); try { ctx.alEmpezar?.(); } catch (e) { ctx.fallo?.(e, 'escenas-empezar'); } },
    alTerminar(r) { soltarTodos(); terminarVista(); try { ctx.alTerminar?.(r); } catch (e) { ctx.fallo?.(e, 'escenas-terminar'); } },
  };
  function limpiarPose(c) {
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
    capa.addEventListener('click', () => { if (director.corriendo()) director.avanzar(); });
    caja.addEventListener('click', (e) => {
      const b = e.target.closest?.('button[data-i]');
      if (b) { director.elegir(Number(b.dataset.i)); return; }
      if (director.corriendo()) director.avanzar();
    });
    return dom;
  }
  function empezarVista() {
    armarDom();
    dom.capa.classList.add('activa');
    doc.body.classList.remove('escena-saliendo');
    doc.body.classList.add('escena-en-curso');
    try { const j = ctx.jugador(); j.estado.zoom = false; j.soltar(); } catch { /* sin mouse bloqueado */ }
  }
  function terminarVista() {
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
    const v = String(Math.round(d.fundido * 100) / 100);
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
  function aplicarCamara() {
    const c = director.camara();
    if (!c) return;
    const cam = ctx.camara;
    cam.position.set(c.x, c.y, c.z);
    cam.rotation.set(c.pitch, c.yaw, 0, 'YXZ');
    if (Math.abs(cam.fov - c.fov) > 0.01) { cam.fov = c.fov; cam.updateProjectionMatrix(); }
    cam.updateMatrixWorld();
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
    try { director.actualizar(dt); } catch (e) { ctx.fallo?.(e, 'escenas'); director.saltar(); }
    aplicarCamara();
    pintar();
  }
  // Después de gente.actualizar: las poses propias de las escenas
  function despuesDeGente(dt) {
    if (!captura.size) return;
    for (const [clave, c] of captura) {
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
    director, mundo, actualizar, despuesDeGente, tecla, teclaSuelta, disparar, mirarA,
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
    mirando: () => mirada.activa(),
    PERSONAJES_BASE,
  };
}
