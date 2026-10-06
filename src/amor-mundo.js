// 3.7.1 (mundo): el amor en el mundo (PLAN_3_7.md, «3.7.1 — Amor en la aldea»). Las reglas son de amor.js y amor-juego.js;
// dónde está cada uno y qué hace, de amor-escenas.js (puro). Acá se ve y se mueve:
//   · la pareja: aldea-gente.js la lleva con `destino(clave)` (la cita, el casamiento y la fiesta, el refugio de noche);
//     amor-juego.js ya no la pone de una (`llevar`/`soltar`): va caminando;
//   · caminar juntos (`caminar`, y al volver de una cita): a tu lado, cerca, de la mano o del brazo según la etapa
//     (gente.js, `gestoAmor`);
//   · el casamiento: el juez de paz llega en el tren de la mañana, los invitados y tu familia en sus lugares, y la
//     fiesta chica de después (en el salón o en la plaza con una mesa larga): música, baile y el brindis;
//   · la mudanza: las cosas de ella en el refugio (su silla, su baúl, lo de su oficio, una manta; las cajas los primeros
//     días) y el desayuno de la mañana después; o tu mochila en la casa de ella;
//   · el cuarto de los chicos (amor-escenas.js, `cuartoDe`): se suma a la casa cuando nace alguien, con la cuna y las
//     camas; el bebé en la cuna o en brazos de la mamá; los chicos en el estilo P (gente.js) con su rutina;
//   · el anillo en el yunque de Anselmo mientras lo hace (y listo, esperándote).
// Con el ajuste «Romance» apagado (o en el Desafío, donde ni se arma) no se ve nada de esto.
// Fluidez: todo lo que se dibuja es de a una malla con el material de las estructuras (sin programas nuevos: no se
// compila nada a mitad de juego), las figuras se arman de a poco (como la gente de la aldea) y lo lejano no se anima.
import * as THREE from 'three';
import { Constructor, matriz } from './geometria.js';
import { piezas } from './piezas.js';
import { LUGARES_CITA, AMOR, invitadosBoda } from './amor.js';
import { marcoAldea, PARADA_ALDEA, edificioEnMundo, puntosFijosDe, EDIFICIOS_ALDEA, LOTE_DE, localAbierto, ETAPAS_CHICOS } from './aldea.js';
import { recorridoAldea, distanciaAldea } from './aldea-gente.js';
import { nombreCorto } from './vecindad.js';
import { FAMILIA } from './aldea-vida.js';
import { melodiaDelBaile } from './aldea-mecanicas.js';
import { empezarMelodia, seguirMelodia, callarMelodia } from './personal-musica.js';
import { registrarLuz, olvidarLuz } from './luces.js';
import { destinoPareja, destinoHijo, escenaBoda, cuartoDe, marcoCuarto, puntoCuarto, cuartoVisible, figuraHijo, aMundoMarco, CUARTO, MUEBLES_CUARTO, REFUGIO, SILLA_REFUGIO, MESA_REFUGIO, JUNTOS, puedeCaminar, FRASES_JUNTOS, FRASES_MANANA, FRASES_FIESTA, JUEZ, BODA } from './amor-escenas.js';

const PI = Math.PI;
const DUENIO = 'amor-mundo';
const VER_COSAS = 30;   // a cuántos metros se ven las cosas de adentro (como los muebles de la aldea)
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

// ---------------------------------------------------------------- piezas chicas (todas aTipo 0/4, sin texturas)
function cj(c, pos, tam, color, rot = [0, 0, 0], tipo = 0) { c.agregar(new THREE.BoxGeometry(...tam), { color, tipo, matriz: matriz(pos, rot), variar: 0.08 }); }
function cil(c, pos, r0, r1, alto, color, tipo = 4, lados = 8, rot = [0, 0, 0]) { c.agregar(new THREE.CylinderGeometry(r0, r1, alto, lados), { color, tipo, matriz: matriz(pos, rot), variar: 0.06 }); }
function bola(c, pos, r, color, esc = [1, 1, 1], tipo = 4) { c.agregar(new THREE.SphereGeometry(r, 9, 7), { color, tipo, matriz: matriz(pos, [0, 0, 0], esc), variar: 0.05 }); }
function aro(c, pos, r, tubo, color, rot = [PI / 2, 0, 0]) { c.agregar(new THREE.TorusGeometry(r, tubo, 6, 18), { color, tipo: 4, matriz: matriz(pos, rot), variar: 0.02 }); }

// El bebé envuelto en su manta (la cabeza asomando con el gorrito): en la cuna y en brazos de la mamá.
function geoBebe(color = '#d8c8b0') {
  const c = new Constructor();
  bola(c, [0, 0, 0], 0.16, color, [1.0, 0.62, 1.55]);
  bola(c, [0, 0.02, 0.24], 0.075, '#e2b89a');
  bola(c, [0, 0.055, 0.25], 0.078, '#f0e6d4', [1, 0.7, 1]);   // el gorrito
  cj(c, [0, 0.07, -0.02], [0.24, 0.02, 0.22], '#b89a7a', [0, 0, 0], 4);   // el borde de la manta, doblado
  return c.geometria();
}
// La copa del brindis (un vaso de vino tinto)
function geoCopa() {
  const c = new Constructor();
  cil(c, [0, 0.05, 0], 0.03, 0.022, 0.08, '#d8d6cc', 4, 8);
  cil(c, [0, 0.035, 0], 0.026, 0.02, 0.045, '#6a1a28', 4, 8);
  return c.geometria();
}

export function crearAmorMundo(ctx) {
  const M = marcoAldea(PARADA_ALDEA);
  const progreso = () => ctx.progreso();
  const dia = () => Math.max(1, Math.floor(Number(progreso().dia) || 1));
  const horas = () => Number(progreso().horas) || 0;
  const mat = ctx.mat;
  const escena = ctx.escena;
  const T = ctx.T;
  const colD = { agregar: (o) => ctx.col?.agregar({ ...o, duenio: DUENIO }), agregarPlataforma: (p) => ctx.col?.agregarPlataforma({ ...p, duenio: DUENIO }) };
  const activo = () => !!ctx.activo?.();

  // ---------------------------------------------------------------- los marcos (para amor-escenas.js)
  const refugio = () => { const r = T.lugares?.refugio; return r && Number.isFinite(r.x) ? { x: r.x, z: r.z, y: r.y ?? T.altura(r.x, r.z), rot: r.rot || 0 } : null; };
  function marcoEdificio(id) {
    if (id === 'refugio') return refugio();
    const s = ctx.aldeaMundo?.()?.estadoEdificio?.(id)?.sitio;
    if (s && Number.isFinite(s.x)) return { x: s.x, z: s.z, y: s.y, rot: s.rot };
    const e = edificioEnMundo(id);
    return e ? { x: e.x, z: e.z, y: e.y, rot: e.rot } : null;
  }
  const centroAldea = M.aMundo(0, 40);
  const marcos = {
    refugio: null, edificio: marcoEdificio, lugarValle: (k) => (Number.isFinite(T.lugares?.[k]?.x) ? T.lugares[k] : null),
    // (el `mira` de un sentadero es el del jugador, que mira hacia −Z: la gente mira al revés)
    sentadero: (x, z, r) => { let mejor = null, dm = r; for (const s of ctx.sentaderos?.() || []) { if (s.cama) continue; const d = Math.hypot(s.x - x, s.z - z); if (d < dm) { dm = d; mejor = s; } } return mejor ? { x: mejor.x, z: mejor.z, mira: (mejor.mira || 0) + Math.PI, asiento: Math.max(0, mejor.y - T.altura(mejor.x, mejor.z)) } : null; },
    seco: (x, z) => !T.agua(x, z), sendero: T.sendero || [], aldea: centroAldea, aMundoPlano: (x, z) => M.aMundo(x, z), rotPlano: (r) => M.rotMundo(r),
  };

  // ---------------------------------------------------------------- lo de este momento (una vez por vuelta)
  let mundo = { activo: false }, esc = null, fiesta = null, bodaVista = null;
  const vuelta = { t: -1 };
  function repasar(forzar = false) {
    const t = dia() * 24 + horas();
    if (!forzar && Math.abs(t - vuelta.t) < 1e-6) return;
    vuelta.t = t;
    marcos.refugio = refugio();
    mundo = activo() ? ctx.amor?.()?.mundo?.() || { activo: false } : { activo: false };
    if (!mundo.activo) { esc = null; return; }
    // la fiesta: desde que se casaron (se ve pasar del casamiento de hoy a casados)
    const p = progreso(), d = dia(), h = horas();
    if (mundo.boda?.hoy) bodaVista = { dia: d, con: mundo.boda.con };
    const con = p.amor?.conyuge, f = con ? p.amor.personas?.[con] : null;
    if (!fiesta && f?.etapa === 'casados' && f.desde === d) {
      if (bodaVista?.dia === d && bodaVista.con === con) { fiesta = { dia: d, desde: Math.max(0, h - 0.01), con }; avisarFiesta = true; }
      else if (h >= 11 && h < 16) fiesta = { dia: d, desde: Math.max(11, h - 0.25), con };   // (se cargó la partida a la mitad)
    }
    if (fiesta && fiesta.dia !== d) fiesta = null;
    const presentes = [...(ctx.aldeaGente?.()?.personas?.keys?.() || [])];
    esc = escenaBoda(p, { dia: d, hora: h, mundo, aldea: p.aldea, fiesta, presentes, invitados: mundo.boda || fiesta ? invitadosBoda(p) : null });
  }
  let avisarFiesta = false;

  // ---------------------------------------------------------------- para aldea-gente.js
  // Dónde va `k` por el amor (o null): la escena del casamiento, o lo de la pareja.
  function destino(k) {
    if (!activo()) return null;
    repasar();
    if (!mundo.activo) return null;
    if (esc) {
      if (esc.ella?.clave === k) return esc.ella.destino;
      const x = esc.personas.get(k);
      if (x) return x;
    }
    return destinoPareja(progreso(), k, { dia: dia(), hora: horas(), aldea: progreso().aldea, mundo, marcos, escena: esc, puesta: ctx.amor?.()?.puesta?.() || null });
  }

  // ---------------------------------------------------------------- las figuras propias (los hijos, el juez, tu familia)
  // Como la gente de la aldea: se arman de a poco (gente.js, armarPobladorDeAPoco), caminan por las calles
  // (recorridoAldea) y de la aldea al refugio (o al revés) se van por el andén y llegan caminando por el camino.
  const figuras = new Map();   // id → { def, npc, tarea, clave, plan, ... }
  function pedirFigura(id, def) {
    let f = figuras.get(id);
    if (f && f.firma !== def.firma) { quitarFigura(id); f = null; }
    if (!f) { f = { id, def, firma: def.firma, npc: null, tarea: null, clave: '', plan: [] }; figuras.set(id, f); }
    return f;
  }
  function quitarFigura(id) {
    const f = figuras.get(id);
    if (!f) return;
    if (f.npc) { ctx.gente?.()?.quitar?.(f.npc); if (f.bebe) f.bebe = null; }
    else if (f.tarea?.npc) ctx.gente?.()?.quitar?.(f.tarea.npc);
    figuras.delete(id);
  }
  // armar de a poco la que falte (una por vez)
  let armando = null, sinLugar = 0;
  function avanzarArmado() {
    const g = ctx.gente?.();
    if (!g?.armarPobladorDeAPoco) return;
    // (si el planificador no da lugar en un buen rato, igual se arma un poco: que nunca quede sin armar)
    let ms = ctx.msFigura?.() ?? 3;
    if (!(ms > 0)) { sinLugar++; if (sinLugar < 20) return; ms = 3; }
    sinLugar = 0;
    if (armando && (!figuras.has(armando.id) || figuras.get(armando.id) !== armando)) armando = null;
    if (!armando) armando = [...figuras.values()].find((f) => !f.npc && f.querida) || null;
    if (!armando) return;
    const f = armando;
    if (!f.tarea) {
      const p0 = f.querida;
      f.tarea = g.armarPobladorDeAPoco({ ...f.def, pos: { x: p0.x, z: p0.z }, mira: { x: p0.x + Math.sin(p0.mira || 0), z: p0.z + Math.cos(p0.mira || 0) }, camino: [] });
    }
    if (f.tarea.avanzar(ms)) {
      f.npc = f.tarea.npc; f.tarea = null; armando = null;
      // (`enLejano`: como la que vuelve al refugio, no se frena al pasar al lado tuyo: va a lo suyo)
      if (f.npc) { f.npc.claveAldea = f.def.claveAldea || 'amor'; f.npc.amorId = f.id; f.npc.dormido = true; f.npc.enLejano = true; f.clave = ''; }
    }
  }
  const jugadorPos = () => ctx.jugador?.()?.pos || null;
  const altura = (x, z, y = 0) => ctx.alturaDePie?.(x, z, y) ?? T.altura(x, z);
  function ubicarFigura(n, d) {
    n.pos.set(d.x, Number.isFinite(d.y) ? d.y : altura(d.x, d.z, n.pos.y), d.z);
    n.camino = []; n.espera = 0;
    n.miraFinal = d.mira ?? 0; n.rumbo = n.rumboObjetivo = n.miraFinal;
    if (n.g?.rotation) n.g.rotation.y = n.miraFinal;
    n.pose = d.pose || null; n.asiento = Number.isFinite(d.asiento) ? d.asiento : undefined;
    n.soloCerca = d.adentro ? 25 : 0;
  }
  const enAldea = (p) => distanciaAldea(p.x, p.z, M) < 4;
  // el andén de la aldea (por donde se sale y se llega en la trochita)
  const anden = () => { const q = puntosFijosDe('estacion-aldea').anden, w = M.aMundo(q.x, q.z); return { x: w.x, z: w.z, mira: M.rotMundo(q.rot) }; };
  // el camino por las calles de la aldea, en el mundo
  function porLaAldea(desde, hasta) {
    const a = M.aLocal(desde.x, desde.z), b = M.aLocal(hasta.x, hasta.z);
    return recorridoAldea({ x: a.lx, z: a.lz }, { x: b.lx, z: b.lz }).map((q) => ({ ...M.aMundo(q.x, q.z), sinChoque: !!q.sinChoque, cerca: 0.5 }));
  }
  const caminar = (pts) => ({ tipo: 'caminar', pts });
  // Lleva la figura `f` a `d` (un destino de amor-escenas.js, con x, z): arma el plan (caminar, saltar sin que se vea,
  // caminar) y lo va cumpliendo.
  function llevarFigura(f, d) {
    const n = f.npc, js = jugadorPos();
    const ver = (p) => !!js && dist(js, p) < 90;
    const fin = { tipo: 'llegar', d };
    const ultimo = { x: d.x, z: d.z, sinChoque: !!d.adentro, cerca: 0.12, ...(Number.isFinite(d.y) ? { y: d.y } : {}) };
    const entrada = (d.entrada || []).map((q) => ({ x: q.x, z: q.z, sinChoque: !!q.sinChoque, cerca: 0.5 }));
    if (!ver(n.pos) && !ver(d)) { f.plan = [fin]; return; }
    const aA = enAldea(n.pos), aD = enAldea(d);
    if (aA && aD) { f.plan = [caminar(porLaAldea(n.pos, d).slice(0, -1).concat([ultimo])), fin]; return; }
    if (!aA && !aD && dist(n.pos, d) < 70) { f.plan = [caminar([...(f.salidaPor || []), ...entrada, ultimo]), fin]; return; }
    // de una zona a otra: sale (si lo ves), salta, y llega (si lo ves)
    const plan = [];
    if (ver(n.pos)) plan.push(caminar(aA ? porLaAldea(n.pos, anden()) : [...(f.salidaPor || []), ...(f.salida ? [{ ...f.salida, cerca: 1 }] : [])]));
    const llegada = aD ? anden() : d.llegada;
    if (llegada && ver(d)) {
      plan.push({ tipo: 'saltar', a: llegada });
      plan.push(caminar(aD ? porLaAldea(llegada, d).slice(0, -1).concat([ultimo]) : [...entrada, ultimo]));
    }
    plan.push(fin);
    f.plan = plan;
  }
  function seguirPlan(f) {
    const n = f.npc;
    for (let i = 0; i < 4 && f.plan.length; i++) {
      const p = f.plan[0];
      if (p.tipo === 'caminar') {
        if (!p.puesto) { p.puesto = true; p.t0 = performance.now(); n.camino = p.pts.filter((q) => Number.isFinite(q.x)); n.pose = null; n.asiento = undefined; n.soloCerca = 0; n.dormido = false; n.espera = 0; }
        if (n.camino?.length && performance.now() - p.t0 < 60000) return;
        f.plan.shift();
      } else if (p.tipo === 'saltar') {
        n.pos.set(p.a.x, altura(p.a.x, p.a.z, n.pos.y), p.a.z); n.camino = [];
        f.plan.shift();
      } else if (p.tipo === 'llegar') {
        ubicarFigura(n, p.d);
        f.salida = p.d.llegada || null; f.salidaPor = p.d.entrada ? [...p.d.entrada].reverse().map((q) => ({ x: q.x, z: q.z, sinChoque: !!q.sinChoque, cerca: 0.5 })) : null;
        f.plan.shift();
      } else return;
    }
  }
  // Cada vuelta: a dónde va cada figura propia (null: no está, se esconde)
  function moverFigura(f, d) {
    const n = f.npc;
    if (!n) return;
    const js = jugadorPos();
    if (!d) { n.dormido = true; n.camino = []; f.clave = ''; f.plan = []; return; }
    const clave = `${d.edificio || ''}|${d.punto || ''}|${d.x.toFixed(1)}|${d.z.toFixed(1)}`;
    if (clave !== f.clave) { f.clave = clave; llevarFigura(f, d); }
    seguirPlan(f);
    n.dormido = !js || (dist(js, n.pos) > 150);
  }

  // ---------------------------------------------------------------- los hijos
  let bebeEnCuna = null;   // el bebé que duerme en la cuna (su punto), o null
  let geoDelBebe = null;
  function bebeEnBrazos(npc, si) {
    if (!npc?.g) return;
    let m = npc.__bebe;
    if (si && !m) {
      geoDelBebe = geoDelBebe || geoBebe();
      m = new THREE.Mesh(geoDelBebe, mat);
      m.position.set(0, 1.1, 0.25); m.rotation.y = PI / 2;
      m.castShadow = true;
      npc.g.add(m); npc.__bebe = m;
    }
    if (m) m.visible = !!si;
    if (si) npc.gestoAmor = { tipo: 'acunar' };
    else if (npc.gestoAmor?.tipo === 'acunar') npc.gestoAmor = null;
  }
  let madreConBebe = null;
  function actualizarHijos() {
    const p = progreso(), d = dia(), h = horas();
    const hijos = p.amor?.hijos || [];
    let enBrazos = null;
    const enCuna = [];
    hijos.forEach((hj, i) => {
      if (!mundo.activo || d < hj.nacio) { quitarFigura(`hijo-${i + 1}`); return; }
      const def = figuraHijo(hj, i, d);
      const dest = destinoHijo(p, i, { dia: d, hora: h, mundo, aldea: p.aldea, marcos });
      if (!def) {
        quitarFigura(`hijo-${i + 1}`);
        if (dest?.donde === 'mama') enBrazos = hj.madre;
        else if (dest?.donde === 'cuna') enCuna.push(dest);
        return;
      }
      const f = pedirFigura(`hijo-${i + 1}`, { ...def, firma: `${def.etapa}|${def.nombre}`, claveAldea: 'hijo', mano: null, camino: [] });
      if (dest) f.querida = f.querida || dest;
      moverFigura(f, dest);
    });
    // el bebé en brazos de la mamá (y ella, acunándolo), o en la cuna
    const madre = enBrazos ? ctx.aldeaGente?.()?.personas?.get(enBrazos)?.npc : null;
    if (madreConBebe && madreConBebe !== madre) bebeEnBrazos(madreConBebe, false);
    if (madre) bebeEnBrazos(madre, !madre.dormido);
    madreConBebe = madre || null;
    bebeEnCuna = enCuna[0] || null;
  }

  // ---------------------------------------------------------------- el cuarto de los chicos
  const cuarto = { firma: '', grupo: null, bebe: null, mc: null, casa: null, luz: null };
  function quitarCuarto() {
    if (cuarto.grupo) { cuarto.grupo.parent?.remove(cuarto.grupo); cuarto.grupo.traverse((o) => { if (o.isMesh && o.geometry !== geoDelBebe) o.geometry?.dispose?.(); }); }
    ctx.col?.eliminarPorDuenio?.(`${DUENIO}-cuarto`);
    if (cuarto.luz) olvidarLuz(cuarto.luz);
    Object.assign(cuarto, { firma: '', grupo: null, bebe: null, mc: null, casa: null, luz: null });
  }
  function actualizarCuarto() {
    const vis = mundo.activo ? cuartoVisible(mundo) : null;
    const firma = vis ? `${vis.casa}|${vis.camas.join(',')}|${vis.cuna}` : '';
    if (firma !== cuarto.firma) {
      quitarCuarto();
      if (vis) armarCuarto(vis, firma);
    }
    if (cuarto.bebe) cuarto.bebe.visible = !!bebeEnCuna && bebeEnCuna.casa === cuarto.casa;
    if (cuarto.grupo) { const js = jugadorPos(); cuarto.grupo.visible = !js || dist(js, cuarto.mc) < 160; }
    // la lámpara: prendida a la tardecita, y de noche un velador bajito (sólo de cerca: entra en el presupuesto fijo de luces.js)
    if (cuarto.luz) {
      const h = horas(), js = jugadorPos();
      const prende = h >= 18 && h < 21.5 ? 1.3 : h >= 21.5 || h < 6.5 ? 0.7 : 0;
      cuarto.luz.intensity = js && dist(js, cuarto.mc) < 22 ? prende : 0;
    }
  }
  function armarCuarto(vis, firma) {
    const cu = cuartoDe(vis.casa), mc = marcoCuarto(cu, marcoEdificio(vis.casa));
    if (!mc) return;
    const c = new Constructor();
    const s = mc.espejo || 1, W = CUARTO.ancho, D = CUARTO.fondo, P = mc.piso, HI = mc.alto, LO = mc.bajo;
    const X = (x) => s * x;
    const colC = { agregar: (o) => ctx.col?.agregar({ ...o, duenio: `${DUENIO}-cuarto` }), agregarPlataforma: (p) => ctx.col?.agregarPlataforma({ ...p, duenio: `${DUENIO}-cuarto` }) };
    const PR = piezas(c, colC, { x: mc.x, z: mc.z, y: mc.y, rot: mc.rot }, matriz);
    const suelo = (lx, lz) => { const w = aMundoMarco(mc, lx, lz); return T.altura(w.x, w.z) - mc.y; };
    const alto = (ux) => LO + (HI - LO) * (ux + W / 2) / W;   // la chapa a un agua: baja hacia afuera (ux sin espejar)
    const TABLA = '#8a6b4a', TABLA2 = '#7a5c40', OSCURA = '#4e3a28';
    // el piso (con su plataforma) y los pilotes hasta el terreno
    PR.pisoCaja({ lx: 0, lz: 0, largo: W, ancho: D, alto: P - 0.07, espesor: 0.14, color: '#8a6e50' });
    for (const ux of [-W / 2 + 0.12, 0, W / 2 - 0.12]) for (const uz of [-D / 2 + 0.12, D / 2 - 0.12]) {
      const s0 = suelo(X(ux), uz);
      if (s0 < P - 0.2) cil(c, [X(ux), (s0 - 0.15 + P - 0.14) / 2, uz], 0.07, 0.08, P - 0.14 - s0 + 0.15, OSCURA, 0, 7);
    }
    // las paredes de tablas verticales (la de la casa es la de la casa)
    const tabla = (ux, uz, largo, a0, a1, sobreX) => {
      const h = a1 - a0;
      if (h <= 0.02) return;
      cj(c, sobreX ? [X(ux), P + a0 + h / 2, uz] : [X(ux), P + a0 + h / 2, uz], sobreX ? [0.07, h, largo] : [largo, h, 0.07], ((Math.round(ux * 7 + uz * 5) & 1) ? TABLA : TABLA2), [0, 0, 0], 0);
    };
    const anchoT = 0.2;
    const puerta = CUARTO.puerta;
    for (let ux = -W / 2 + anchoT / 2; ux < W / 2; ux += anchoT) {
      const top = alto(ux) - P;
      tabla(ux, -D / 2, anchoT * 0.98, 0, top, false);   // el fondo
      const enPuerta = Math.abs(ux - puerta.x) < puerta.ancho / 2;
      if (enPuerta) tabla(ux, D / 2, anchoT * 0.98, puerta.alto, top, false);   // arriba de la puerta
      else tabla(ux, D / 2, anchoT * 0.98, 0, top, false);
    }
    const ventana = { z: 0.05, a0: 1.0, a1: 1.55, ancho: 0.7 };
    for (let uz = -D / 2 + anchoT / 2; uz < D / 2; uz += anchoT) {
      const top = LO - P;
      if (Math.abs(uz - ventana.z) < ventana.ancho / 2) { tabla(-W / 2, uz, anchoT * 0.98, 0, ventana.a0, true); tabla(-W / 2, uz, anchoT * 0.98, ventana.a1, top, true); }
      else tabla(-W / 2, uz, anchoT * 0.98, 0, top, true);
    }
    // marcos de la puerta y la ventana, y el postigo abierto
    for (const l of [-1, 1]) cj(c, [X(puerta.x + l * (puerta.ancho / 2 + 0.04)), P + puerta.alto / 2, D / 2 + 0.05], [0.08, puerta.alto, 0.1], OSCURA);
    cj(c, [X(puerta.x), P + puerta.alto + 0.04, D / 2 + 0.05], [puerta.ancho + 0.16, 0.08, 0.1], OSCURA);
    cj(c, [X(puerta.x - puerta.ancho / 2 - 0.02), P + puerta.alto / 2, D / 2 + 0.42], [0.05, puerta.alto - 0.08, puerta.ancho - 0.06], '#6a4a32', [0, s * 0.35, 0], 0);   // la hoja, abierta
    for (const l of [-1, 1]) cj(c, [X(-W / 2 - 0.05), P + (ventana.a0 + ventana.a1) / 2, ventana.z + l * (ventana.ancho / 2 + 0.03)], [0.08, ventana.a1 - ventana.a0 + 0.1, 0.06], OSCURA);
    for (const a of [ventana.a0, ventana.a1]) cj(c, [X(-W / 2 - 0.05), P + a, ventana.z], [0.09, 0.06, ventana.ancho + 0.12], OSCURA);
    cj(c, [X(-W / 2 - 0.08), P + (ventana.a0 + ventana.a1) / 2, ventana.z], [0.02, ventana.a1 - ventana.a0, ventana.ancho], '#2a2a30', [0, 0, 0], 4);   // el vidrio, oscuro
    // la chapa a un agua (con el alero de afuera, el del frente y el de atrás), y sus costillas
    const ang = Math.atan2(HI - LO, W), largoT = Math.hypot(W + 0.3, (HI - LO) * (W + 0.3) / W);
    const cxT = -0.15, cyT = (alto(cxT) + 0.05);
    cj(c, [X(cxT), cyT, 0], [largoT, 0.04, D + 0.5], '#7a7e82', [0, 0, s * ang], 4);
    for (let k = -3; k <= 3; k++) cj(c, [X(cxT), cyT + 0.03, k * (D + 0.4) / 7], [largoT, 0.025, 0.04], '#6c7074', [0, 0, s * ang], 4);
    cj(c, [X(-W / 2 + 0.02), LO + 0.0, 0], [0.1, 0.1, D + 0.1], OSCURA);   // la solera de afuera
    // el escalón de la puerta, si hace falta
    const sp = suelo(X(puerta.x), D / 2 + 0.45);
    if (P - sp > 0.22) { const tope = (P + sp) / 2, esp = Math.max(0.1, tope - sp + 0.05); PR.escalon({ lx: X(puerta.x), lz: D / 2 + 0.42, largo: puerta.ancho + 0.2, ancho: 0.5, alto: tope - esp / 2, espesor: esp, color: OSCURA }); }
    // la colisión de las tres paredes (la de la casa ya está)
    const PARED = { desde: P - 0.05, hasta: HI, espesor: 0.08, dibujar: false };
    PR.paredRecta({ ...PARED, a: [X(-W / 2), -D / 2], b: [X(W / 2), -D / 2] });
    PR.paredRecta({ ...PARED, a: [X(-W / 2), -D / 2], b: [X(-W / 2), D / 2] });
    const a0 = [X(-W / 2), D / 2], b0 = [X(W / 2), D / 2];
    const enLaPared = (ux) => (s > 0 ? ux + W / 2 : W / 2 - ux);
    const h0 = enLaPared(puerta.x - puerta.ancho / 2), h1 = enLaPared(puerta.x + puerta.ancho / 2);
    PR.paredRecta({ ...PARED, a: a0, b: b0, huecos: [{ desde: Math.min(h0, h1), hasta: Math.max(h0, h1) }] });
    // adentro: la alfombra, el caballito de madera, un estante con juguetes
    cj(c, [X(0.15), P + 0.008, 0.3], [1.2, 0.012, 0.8], '#8a3a32', [0, 0, 0], 4);
    cj(c, [X(0.15), P + 0.01, 0.3], [0.9, 0.012, 0.55], '#c7a76a', [0, 0, 0], 4);
    {
      const x0 = X(0.95), z0 = 0.75;
      bola(c, [x0, P + 0.32, z0], 0.12, '#a8784a', [1.6, 0.8, 0.8]); bola(c, [x0 + s * 0.18, P + 0.44, z0], 0.07, '#a8784a', [1.2, 1, 0.8]);
      for (const dx of [-0.12, 0.12]) for (const dz of [-0.05, 0.05]) cj(c, [x0 + s * dx, P + 0.18, z0 + dz], [0.03, 0.22, 0.03], '#8a5a3a');
      cj(c, [x0, P + 0.06, z0], [0.5, 0.03, 0.14], '#6a4a32', [0, 0, 0.0]);
    }
    cj(c, [X(1.25), P + 1.25, -0.2], [0.2, 0.03, 0.9], TABLA);   // el estante (contra la pared de la casa)
    bola(c, [X(1.25), P + 1.32, -0.45], 0.06, '#d8a040'); cj(c, [X(1.25), P + 1.32, -0.15], [0.1, 0.1, 0.1], '#4a7aa0', [0, 0.4, 0]); bola(c, [X(1.25), P + 1.33, 0.12], 0.07, '#c8b8a0', [1, 1.1, 1]);
    // la lámpara de techo (una pantalla de mimbre)
    cil(c, [X(0.1), alto(0.1) - 0.45, 0.0], 0.11, 0.17, 0.16, '#c8a870', 4, 9);
    cil(c, [X(0.1), alto(0.1) - 0.2, 0.0], 0.008, 0.008, 0.36, '#3a3530', 4, 4);
    // la cuna y las camas (de las que hacen falta)
    const cama = (m, conManta) => {
      const g = m.giro || 0, L = m.largo, A = m.ancho;
      const yc = P + 0.3;
      const largoX = Math.abs(Math.cos(g)) > 0.5 ? L : A, anchoZ = Math.abs(Math.cos(g)) > 0.5 ? A : L;
      cj(c, [X(m.x), yc, m.z], [largoX, 0.12, anchoZ], OSCURA);
      cj(c, [X(m.x), yc + 0.1, m.z], [largoX - 0.06, 0.1, anchoZ - 0.06], '#d8d0c0', [0, 0, 0], 4);
      if (conManta) cj(c, [X(m.x) + (Math.abs(Math.cos(g)) > 0.5 ? s * 0.2 : 0), yc + 0.16, m.z + (Math.abs(Math.cos(g)) > 0.5 ? 0 : 0.2)], [largoX - (Math.abs(Math.cos(g)) > 0.5 ? 0.45 : 0.04), 0.04, anchoZ - (Math.abs(Math.cos(g)) > 0.5 ? 0.04 : 0.45)], conManta, [0, 0, 0], 4);
      // la almohada, en la cabecera (la punta de −X en la 1, la de −Z en la 2)
      if (Math.abs(Math.cos(g)) > 0.5) cj(c, [X(m.x - L / 2 + 0.2), yc + 0.2, m.z], [0.26, 0.09, A - 0.2], '#efe8da', [0, 0, 0], 4);
      else cj(c, [X(m.x), yc + 0.2, m.z - L / 2 + 0.2], [A - 0.2, 0.09, 0.26], '#efe8da', [0, 0, 0], 4);
      // patas y cabecera
      for (const dx of [-1, 1]) for (const dz of [-1, 1]) cj(c, [X(m.x + dx * (largoX / 2 - 0.04)), P + 0.12, m.z + dz * (anchoZ / 2 - 0.04)], [0.06, 0.24, 0.06], OSCURA);
      if (Math.abs(Math.cos(g)) > 0.5) cj(c, [X(m.x - L / 2 + 0.03), P + 0.45, m.z], [0.05, 0.42, A], OSCURA);
      else cj(c, [X(m.x), P + 0.45, m.z - L / 2 + 0.03], [A, 0.42, 0.05], OSCURA);
      PR.mueble({ lx: X(m.x), ly: yc, lz: m.z, largo: largoX, alto: 0.3, ancho: anchoZ, color: OSCURA, dibujar: false, pisable: true });
    };
    const MANTAS = ['#4a6a8a', '#8a4a5a'];
    vis.camas.forEach((i) => { const m = MUEBLES_CUARTO[`cama-hijo-${i + 1}`]; if (m) cama(m, MANTAS[i % 2]); });
    if (vis.cuna) {
      const m = MUEBLES_CUARTO.cuna;
      const y0 = P + 0.45;
      cj(c, [X(m.x), y0, m.z], [m.largo, 0.05, m.ancho], '#c8a878');
      cj(c, [X(m.x), y0 + 0.06, m.z], [m.largo - 0.08, 0.07, m.ancho - 0.08], '#f0e8d8', [0, 0, 0], 4);
      for (const dx of [-1, 1]) for (const dz of [-1, 1]) cj(c, [X(m.x + dx * (m.largo / 2 - 0.02)), P + 0.4, m.z + dz * (m.ancho / 2 - 0.02)], [0.05, 0.8, 0.05], '#c8a878');
      for (const dz of [-1, 1]) {
        cj(c, [X(m.x), P + 0.78, m.z + dz * (m.ancho / 2 - 0.02)], [m.largo, 0.04, 0.04], '#c8a878');
        for (let k = 1; k < 9; k++) cil(c, [X(m.x - m.largo / 2 + k * m.largo / 9), P + 0.63, m.z + dz * (m.ancho / 2 - 0.02)], 0.012, 0.012, 0.3, '#d8b888', 4, 5);
      }
      for (const dx of [-1, 1]) { cj(c, [X(m.x + dx * (m.largo / 2 - 0.02)), P + 0.78, m.z], [0.04, 0.04, m.ancho], '#c8a878'); for (let k = 1; k < 5; k++) cil(c, [X(m.x + dx * (m.largo / 2 - 0.02)), P + 0.63, m.z - m.ancho / 2 + k * m.ancho / 5], 0.012, 0.012, 0.3, '#d8b888', 4, 5); }
      PR.mueble({ lx: X(m.x), ly: P + 0.4, lz: m.z, largo: m.largo, alto: 0.8, ancho: m.ancho, color: '#c8a878', dibujar: false });
    }
    const grupo = new THREE.Group();
    grupo.position.set(mc.x, mc.y, mc.z); grupo.rotation.y = mc.rot;
    const malla = new THREE.Mesh(c.geometria(), mat);
    malla.castShadow = true; malla.receiveShadow = true;
    grupo.add(malla);
    // el bebé en la cuna (se muestra cuando le toca dormir)
    if (vis.cuna) {
      geoDelBebe = geoDelBebe || geoBebe();
      const q = MUEBLES_CUARTO.cuna;
      const b = new THREE.Mesh(geoDelBebe, mat);
      b.position.set(X(q.x), P + 0.58, q.z); b.rotation.y = PI / 2;
      b.visible = false;
      grupo.add(b); cuarto.bebe = b;
    }
    const luz = new THREE.PointLight(0xffb070, 0, 5.5, 1.6);
    luz.position.set(X(0.1), alto(0.1) - 0.6, 0);
    grupo.add(luz);
    registrarLuz(luz);
    (vis.casa === 'refugio' && ctx.raizRefugio?.() ? ctx.raizRefugio() : escena).add(grupo);
    grupo.updateMatrixWorld(true);
    Object.assign(cuarto, { firma, grupo, mc, casa: vis.casa, luz });
  }

  // ---------------------------------------------------------------- las cosas de ella en el refugio (y las tuyas en su casa)
  const cosas = { firma: '', grupo: null, desayuno: null };
  function quitarCosas() {
    if (cosas.grupo) { cosas.grupo.parent?.remove(cosas.grupo); cosas.grupo.traverse((o) => { if (o.isMesh) o.geometry?.dispose?.(); }); }
    ctx.col?.eliminarPorDuenio?.(`${DUENIO}-cosas`);
    Object.assign(cosas, { firma: '', grupo: null, desayuno: null });
  }
  function actualizarCosas() {
    const p = progreso(), conv = mundo.activo ? mundo.convivencia : null;
    const d = dia(), sep = conv && p.amor?.personas?.[conv.con]?.etapa === 'separados';
    const cajas = conv && d - (conv.desde || 0) < 2;
    const firma = conv && !sep && conv.desde <= d ? `${conv.con}|${conv.donde}|${cajas ? 'cajas' : ''}` : '';
    if (firma !== cosas.firma) { quitarCosas(); if (firma) armarCosas(conv, cajas, firma); }
    if (cosas.desayuno) {
      const niki = Number(p.amor?.niki) || 0, h = horas();
      cosas.desayuno.visible = niki > 0 && d === niki + 1 && h >= 6.8 && h < 11;
    }
    if (cosas.grupo) { const js = jugadorPos(); cosas.grupo.visible = !!js && dist(js, cosas.grupo.position) < VER_COSAS; }
  }
  // lo de su oficio (sobre el baúl o al lado): chiquito y reconocible
  function cosaDelOficio(c, clave, x, y, z) {
    switch (clave) {
      case 'veterinaria': case 'enfermera': cj(c, [x, y + 0.11, z], [0.36, 0.2, 0.18], '#5a3a26'); cj(c, [x, y + 0.23, z], [0.12, 0.04, 0.04], '#3a2a20'); if (clave === 'enfermera') cj(c, [x + 0.181, y + 0.12, z], [0.005, 0.08, 0.02], '#c83030', [0, 0, 0], 4); break;
      case 'fotografa': cj(c, [x, y + 0.1, z], [0.22, 0.16, 0.18], '#2a2826'); cil(c, [x, y + 0.11, z + 0.13], 0.05, 0.05, 0.1, '#3a3836', 4, 10, [PI / 2, 0, 0]); break;
      case 'andinista': bola(c, [x, y + 0.2, z], 0.2, '#a84a2a', [1, 1.2, 0.7]); aro(c, [x + 0.05, y + 0.02, z + 0.3], 0.14, 0.025, '#d8b030', [PI / 2, 0, 0]); break;
      case 'herbolaria': for (let i = 0; i < 4; i++) cil(c, [x - 0.18 + i * 0.12, y + 0.08, z], 0.04, 0.045, 0.15, ['#8e9c6a', '#a88a52', '#7a6a9a', '#9a6a4a'][i], 4, 8); cj(c, [x, y + 0.2, z - 0.1], [0.4, 0.04, 0.04], '#6a8a3a'); break;
      case 'pintora': cj(c, [x, y + 0.02, z], [0.42, 0.03, 0.32], '#e8e0cc'); for (let i = 0; i < 5; i++) bola(c, [x - 0.14 + i * 0.07, y + 0.05, z - 0.06 + (i % 2) * 0.1], 0.025, ['#c83a30', '#3a6ab0', '#e0b030', '#3a8a4a', '#f0f0e8'][i], [1, 0.4, 1]); break;
      case 'ceramista': cil(c, [x, y + 0.14, z], 0.1, 0.07, 0.26, '#b8683a', 4, 12); cil(c, [x + 0.22, y + 0.07, z], 0.07, 0.05, 0.13, '#8a5a3a', 4, 10); break;
      case 'botera': cj(c, [x, y + 0.03, z], [1.0, 0.04, 0.1], '#8a6a4a', [0, 0.1, 0]); cj(c, [x + 0.45, y + 0.03, z], [0.22, 0.03, 0.16], '#7a5a3a'); break;
      case 'astronoma': cil(c, [x, y + 0.12, z], 0.045, 0.06, 0.55, '#b8a070', 4, 10, [0, 0, 1.2]); cj(c, [x + 0.1, y + 0.02, z + 0.15], [0.3, 0.02, 0.22], '#1a2a4a'); break;
      case 'guardaparque': cil(c, [x, y + 0.05, z], 0.22, 0.24, 0.04, '#7a6a4a', 4, 12); cil(c, [x, y + 0.11, z], 0.12, 0.12, 0.1, '#7a6a4a', 4, 12); break;
      case 'galesa': cil(c, [x, y + 0.09, z], 0.1, 0.12, 0.16, '#e8e4d8', 4, 12); bola(c, [x, y + 0.19, z], 0.05, '#e8e4d8'); cil(c, [x + 0.12, y + 0.12, z], 0.012, 0.02, 0.12, '#e8e4d8', 4, 6, [0, 0, -1]); break;
      default: cj(c, [x, y + 0.04, z], [0.3, 0.08, 0.22], '#7a5a6a'); cj(c, [x, y + 0.1, z], [0.26, 0.04, 0.18], '#c8b898'); break;
    }
  }
  function armarCosas(conv, cajas, firma) {
    const c = new Constructor(), cd = new Constructor();
    let base;
    if (conv.donde === 'refugio') {
      base = refugio();
      if (!base) return;
      const P = REFUGIO.piso;
      const colC = { agregar: (o) => ctx.col?.agregar({ ...o, duenio: `${DUENIO}-cosas` }), agregarPlataforma: () => {} };
      const PR = piezas(c, colC, { x: base.x, z: base.z, y: base.y, rot: base.rot }, matriz);
      // su silla, en la cabecera de la mesa (mirando a la mesa)
      const S = SILLA_REFUGIO;
      cj(c, [S.x, P + 0.45, S.z], [0.44, 0.05, 0.42], '#7a5638');
      for (const dx of [-1, 1]) for (const dz of [-1, 1]) cj(c, [S.x + dx * 0.18, P + 0.22, S.z + dz * 0.17], [0.04, 0.45, 0.04], '#5a3e28');
      cj(c, [S.x - 0.2, P + 0.75, S.z], [0.04, 0.55, 0.4], '#7a5638');
      cj(c, [S.x - 0.2, P + 0.62, S.z], [0.05, 0.05, 0.42], '#5a3e28');
      PR.mueble({ lx: S.x, ly: P + 0.45, lz: S.z, largo: 0.44, alto: 0.9, ancho: 0.42, color: '#7a5638', dibujar: false });
      // su baúl contra la pared del costado, con lo de su oficio encima
      const B = { x: 3.0, z: -0.25 };
      cj(c, [B.x, P + 0.22, B.z], [0.48, 0.44, 0.9], '#6a4a30');
      cj(c, [B.x, P + 0.46, B.z], [0.5, 0.06, 0.92], '#5a3a24');
      for (const dz of [-0.3, 0.3]) cj(c, [B.x, P + 0.25, B.z + dz], [0.5, 0.46, 0.04], '#4a4440', [0, 0, 0], 4);
      PR.mueble({ lx: B.x, ly: P + 0.25, lz: B.z, largo: 0.5, alto: 0.5, ancho: 0.92, color: '#6a4a30', dibujar: false });
      cosaDelOficio(c, conv.con, B.x, P + 0.49, B.z);
      // su manta tejida, doblada a los pies de la cama
      cj(c, [3.0, 0.83, -2.0], [0.36, 0.06, 0.92], '#a85a3a', [0, 0, 0], 4);
      cj(c, [3.0, 0.865, -2.0], [0.37, 0.012, 0.6], '#e0c890', [0, 0, 0], 4);
      // las cajas de la mudanza, los primeros días
      if (cajas) {
        cj(c, [-1.45, P + 0.2, 1.95], [0.5, 0.4, 0.4], '#a88458', [0, 0.2, 0]);
        cj(c, [-1.45, P + 0.55, 1.95], [0.4, 0.3, 0.34], '#b8946a', [0, -0.15, 0]);
        cj(c, [-0.98, P + 0.17, 2.1], [0.36, 0.34, 0.36], '#9a7a50', [0, 0.5, 0]);
        PR.mueble({ lx: -1.3, ly: P + 0.35, lz: 2.0, largo: 1.0, alto: 0.7, ancho: 0.5, color: '#a88458', dibujar: false });
      }
      // el desayuno de la mañana después (se muestra a su hora): la pava, el mate, dos tazas y el pan
      const Mz = MESA_REFUGIO;
      cil(cd, [Mz.x - 0.15, Mz.y + 0.07, Mz.z - 0.2], 0.08, 0.1, 0.13, '#3a3a3a', 4, 10);
      cil(cd, [Mz.x - 0.15, Mz.y + 0.16, Mz.z - 0.2], 0.02, 0.04, 0.05, '#2a2a2a', 4, 8);
      cil(cd, [Mz.x + 0.05, Mz.y + 0.05, Mz.z - 0.05], 0.035, 0.03, 0.09, '#8a5a2a', 4, 8);
      cil(cd, [Mz.x + 0.06, Mz.y + 0.12, Mz.z - 0.05], 0.004, 0.004, 0.08, '#c8c8c0', 4, 4, [0, 0, 0.3]);
      for (const dz of [-0.28, 0.25]) cil(cd, [Mz.x + 0.3, Mz.y + 0.04, Mz.z + dz], 0.04, 0.035, 0.08, '#e8e2d4', 4, 10);
      cil(cd, [Mz.x + 0.0, Mz.y + 0.01, Mz.z + 0.2], 0.16, 0.16, 0.02, '#e8e2d4', 4, 14);
      for (let i = 0; i < 4; i++) cj(cd, [Mz.x - 0.06 + i * 0.045, Mz.y + 0.04, Mz.z + 0.2], [0.035, 0.05, 0.11], '#c89050', [0, 0, 0.2], 4);
      cil(cd, [Mz.x - 0.3, Mz.y + 0.05, Mz.z + 0.12], 0.04, 0.04, 0.09, '#7a2a3a', 4, 8);
    } else {
      // vos te mudás a lo de ella: tu mochila y tu poncho, al lado de su cama
      const casa = mundo.convivencia?.edificio;
      base = casa ? marcoEdificio(casa) : null;
      const q = casa ? puntosFijosDe(casa).cama : null;
      if (!base || !q) return;
      const e = EDIFICIOS_ALDEA[casa];
      // (el punto de la cama está en el plano: se pasa al marco del edificio)
      const ce = Math.cos(e.rot), se = Math.sin(e.rot), dx = q.x - e.x, dz = q.z - e.z;
      const bx = dx * ce - dz * se, bz = dx * se + dz * ce;
      const x = bx - 0.55, z = bz + 0.5, P = 0.32;
      bola(c, [x, P + 0.25, z], 0.2, '#5a6a3a', [1, 1.25, 0.7]);
      cj(c, [x, P + 0.47, z], [0.3, 0.06, 0.2], '#4a5a2e');
      cj(c, [x + 0.35, P + 0.08, z], [0.45, 0.16, 0.35], '#8a4a3a', [0, 0.3, 0], 4);   // el poncho doblado
    }
    const grupo = new THREE.Group();
    grupo.position.set(base.x, base.y, base.z); grupo.rotation.y = base.rot;
    const m = new THREE.Mesh(c.geometria(), mat); m.castShadow = true; m.receiveShadow = true;
    grupo.add(m);
    if (cd.pos.length) { const md = new THREE.Mesh(cd.geometria(), mat); md.visible = false; grupo.add(md); cosas.desayuno = md; }
    (conv.donde === 'refugio' && ctx.raizRefugio?.() ? ctx.raizRefugio() : escena).add(grupo);
    grupo.updateMatrixWorld(true);
    cosas.grupo = grupo; cosas.firma = firma;
  }

  // ---------------------------------------------------------------- el anillo en el yunque
  const anillo = { malla: null, estado: '' };
  function actualizarAnillo() {
    const a = mundo.activo ? mundo.anillo : null;
    const estado = a && (a.estado === 'haciendo' || a.estado === 'listo') ? a.estado : '';
    if (estado !== anillo.estado) {
      if (anillo.malla) { anillo.malla.parent?.remove(anillo.malla); anillo.malla.geometry.dispose(); anillo.malla = null; }
      anillo.estado = estado;
      if (estado && localAbierto(progreso().aldea, LOTE_DE.herrero)) {
        const s = marcoEdificio(LOTE_DE.herrero);
        if (s) {
          const c = new Constructor(), P = 0.32, y = P + 0.795;
          // el yunque de aldea-arquitectura.js está en (−1,2, 0,8) del local, con la cara de arriba a 0,79 del piso
          const caliente = estado === 'haciendo';
          aro(c, [-1.08, y + 0.01, 0.8], 0.032, 0.008, caliente ? '#ff8a32' : '#d8dade', [PI / 2, 0, 0]);
          if (caliente) {
            bola(c, [-1.3, y + 0.03, 0.82], 0.045, '#8a8478', [1.2, 0.7, 1]);   // el canto rodado, partido
            bola(c, [-1.24, y + 0.025, 0.76], 0.03, '#7a7468', [1, 0.7, 1.1]);
            cj(c, [-1.42, y + 0.02, 0.8], [0.18, 0.025, 0.04], '#3a3632', [0, 0.3, 0], 4);   // las pinzas
          } else cj(c, [-1.1, y + 0.002, 0.8], [0.16, 0.006, 0.14], '#8a3a32', [0, 0, 0], 4);   // listo, sobre un paño
          const m = new THREE.Mesh(c.geometria(), mat);
          m.position.set(s.x, s.y, s.z); m.rotation.y = s.rot;
          escena.add(m); m.updateMatrixWorld(true);
          anillo.malla = m;
        }
      }
    }
    if (anillo.malla) { const js = jugadorPos(); anillo.malla.visible = !!js && dist(js, anillo.malla.position) < VER_COSAS; }
  }

  // ---------------------------------------------------------------- el casamiento: el juez, tu familia, la fiesta
  let geoDeCopa = null;
  const copas = new Set();
  function darCopa(npc, si) {
    if (!npc?.mano) return;
    if (si && !npc.__copa && !npc.muneca) {
      geoDeCopa = geoDeCopa || geoCopa();
      const m = new THREE.Mesh(geoDeCopa, mat);
      m.position.set(0, -0.09, 0.03);
      npc.mano.add(m); npc.__copa = m; copas.add(npc);
    }
    if (npc.__copa) npc.__copa.visible = !!si;
  }
  const mesaFiesta = { malla: null, clave: '' };
  function quitarMesa() {
    if (mesaFiesta.malla) { mesaFiesta.malla.parent?.remove(mesaFiesta.malla); mesaFiesta.malla.geometry.dispose(); }
    ctx.col?.eliminarPorDuenio?.(`${DUENIO}-mesa`);
    mesaFiesta.malla = null; mesaFiesta.clave = '';
  }
  function armarMesa(q) {
    const w = M.aMundo(q.x, q.z), rot = M.rotMundo(q.rot);
    const y = altura(w.x, w.z, 0);
    const c = new Constructor(), L = q.largo, A = q.ancho;
    const colC = { agregar: (o) => ctx.col?.agregar({ ...o, duenio: `${DUENIO}-mesa` }), agregarPlataforma: () => {} };
    const PR = piezas(c, colC, { x: w.x, z: w.z, y, rot }, matriz);
    cj(c, [0, 0.76, 0], [L, 0.05, A], '#8a6b4a');
    cj(c, [0, 0.79, 0], [L + 0.1, 0.01, A + 0.1], '#ece6d8', [0, 0, 0], 4);   // el mantel
    for (const dx of [-1, 1]) cj(c, [dx * (L / 2 + 0.05), 0.68, 0], [0.01, 0.2, A + 0.1], '#e4ddcc', [0, 0, 0], 4);
    for (const dx of [-1, 0, 1]) for (const dz of [-1, 1]) cj(c, [dx * (L / 2 - 0.1), 0.37, dz * (A / 2 - 0.08)], [0.07, 0.74, 0.07], '#5a4331');
    // la torta, las empanadas, las jarras, los platos y los vasos
    cil(c, [0, 0.86, 0], 0.17, 0.17, 0.12, '#f2ece0', 4, 16); cil(c, [0, 0.95, 0], 0.11, 0.11, 0.07, '#f2ece0', 4, 14); bola(c, [0, 1.0, 0], 0.025, '#c83a3a');
    for (const dx of [-1.05, 1.05]) {
      cil(c, [dx, 0.81, 0.05], 0.19, 0.17, 0.03, '#d8d0c0', 4, 14);
      for (let i = 0; i < 5; i++) bola(c, [dx - 0.1 + (i % 3) * 0.1, 0.84, 0.0 + Math.floor(i / 3) * 0.1], 0.05, '#d89a4a', [1.3, 0.55, 0.8]);
    }
    for (const [dx, col] of [[-0.55, '#7a1a2a'], [0.55, '#e8d070']]) { cil(c, [dx, 0.9, -0.2], 0.06, 0.07, 0.2, '#c8c8c0', 4, 10); cil(c, [dx, 0.88, -0.2], 0.055, 0.065, 0.14, col, 4, 10); }
    for (let i = 0; i < 6; i++) { const dx = -1.3 + i * 0.52; cil(c, [dx, 0.8, 0.32], 0.1, 0.1, 0.012, '#e8e2d4', 4, 12); cil(c, [dx + 0.12, 0.84, 0.22], 0.025, 0.02, 0.08, '#d8d6cc', 4, 8); }
    PR.mueble({ lx: 0, ly: 0.4, lz: 0, largo: L, alto: 0.8, ancho: A, color: '#8a6b4a', dibujar: false });
    const m = new THREE.Mesh(c.geometria(), mat);
    m.position.set(w.x, y, w.z); m.rotation.y = rot; m.castShadow = true; m.receiveShadow = true;
    escena.add(m); m.updateMatrixWorld(true);
    mesaFiesta.malla = m;
  }
  const musica = { s: null, proxima: 0, tanda: 0 };
  function callar() { const s = ctx.sonido?.(); if (musica.s && s) callarMelodia(s, musica.s); musica.s = null; }
  function actualizarMusica() {
    const s = ctx.sonido?.();
    const js = jugadorPos();
    const q = esc?.fase === 'fiesta' ? esc.musica : null;
    const musico = q ? ctx.aldeaGente?.()?.personas?.get('musico')?.npc : null;
    const w = q ? M.aMundo(q.x, q.z) : null;
    const toca = !!(musico && !musico.dormido && w && dist(musico.pos, w) < 2.5);
    const d = js && w ? dist(js, w) : Infinity;
    if (!s?.ctx || !toca || d > 26 || s.musicaActiva === false) { callar(); return; }
    s.proxMusica = Math.max(s.proxMusica || 0, 20);
    const vol = d < 9 ? 1 : Math.max(0, 1 - (d - 9) / 17);
    if (musica.s) {
      try { musica.s.destino.gain.setTargetAtTime(0.85 * vol, s.ctx.currentTime, 0.3); } catch { /* ya */ }
      if (!seguirMelodia(s, musica.s)) { musica.s = null; musica.proxima = s.ctx.currentTime + 3; musica.tanda++; }
      return;
    }
    if (s.ctx.currentTime >= musica.proxima) { musica.s = empezarMelodia(s, melodiaDelBaile(dia() + 3, musica.tanda), vol); if (musica.s) seguirMelodia(s, musica.s); }
  }
  let brindisDicho = 0;
  function actualizarBoda() {
    const p = progreso(), d = dia(), h = horas();
    // el juez de paz: llega a las 10 en el tren de la mañana, va a la biblioteca y al terminar se vuelve al andén
    const juez = esc?.juez ? { ...M.aMundo(esc.juez.plano.x, esc.juez.plano.z), mira: M.rotMundo(esc.juez.rotPlano), adentro: true, edificio: 'biblioteca', punto: 'juez', pose: null } : null;
    const casoHoy = fiesta?.dia === d && h < fiesta.desde + 1.5;
    if (juez || casoHoy) {
      const f = pedirFigura('juez', { ...JUEZ, firma: 'juez', claveAldea: 'juez', velocidad: 0.9, camino: [] });
      f.querida = f.querida || anden();
      if (juez) moverFigura(f, juez);
      else if (f.npc) {
        // se vuelve al tren
        const a = anden();
        if (f.clave !== 'yendose') { f.clave = 'yendose'; f.plan = [caminar(porLaAldea(f.npc.pos, a)), { tipo: 'irse' }]; }
        if (f.plan[0]?.tipo === 'irse' || !f.plan.length) { f.npc.dormido = true; f.plan = []; } else { seguirPlan(f); f.npc.dormido = false; }
      }
    } else quitarFigura('juez');
    // tu familia: en la biblioteca (en el sillón) y en la fiesta
    const fam = esc?.familia || [];
    for (const quien of ['mama', 'hermano']) {
      const x = fam.find((q) => q.quien === quien);
      if (!x?.destino) { quitarFigura(`familia-${quien}`); continue; }
      const def = FAMILIA[quien];
      const f = pedirFigura(`familia-${quien}`, { clave: `familia-${quien}`, colores: def.colores, nombre: def.nombre, oficio: def.oficio, saludo: def.saludo, despedida: def.despedida, mano: def.mano, velocidad: 0.85, firma: quien, claveAldea: 'familia-boda', camino: [] });
      const q = x.destino.plano ? x.destino.plano : puntosFijosDe(x.destino.edificio)[x.destino.punto];
      if (!q) continue;
      const w = M.aMundo(q.x, q.z);
      const dest = { ...w, mira: M.rotMundo(x.destino.rotPlano ?? q.rot ?? 0), adentro: esc.donde !== 'plaza', edificio: x.destino.edificio, punto: x.destino.punto, pose: x.destino.pose || null, asiento: x.destino.sentado ? 0.45 : undefined };
      f.querida = f.querida || anden();
      moverFigura(f, dest);
    }
    // la fiesta: la mesa en la plaza, las copas, la música y el aviso del brindis
    const enFiesta = esc?.fase === 'fiesta';
    const claveMesa = enFiesta && esc.mesa ? `${esc.mesa.x}|${esc.mesa.z}` : '';
    if (claveMesa !== mesaFiesta.clave) { quitarMesa(); if (claveMesa) { armarMesa(esc.mesa); mesaFiesta.clave = claveMesa; } }
    if (mesaFiesta.malla) { const js = jugadorPos(); mesaFiesta.malla.visible = !!js && dist(js, mesaFiesta.malla.position) < 140; }
    const conCopa = new Set();
    if (enFiesta) {
      const ag = ctx.aldeaGente?.()?.personas;
      for (const [k, x] of esc.personas) if (x.copa || esc.brindis) { const n = ag?.get(k)?.npc; if (n && !n.dormido) conCopa.add(n); }
      for (const f of figuras.values()) if (f.id.startsWith('familia-') && f.npc && esc.brindis) conCopa.add(f.npc);
    }
    for (const n of copas) if (!conCopa.has(n)) darCopa(n, false);
    for (const n of conCopa) darCopa(n, true);
    if (avisarFiesta && enFiesta) { avisarFiesta = false; const t = FRASES_FIESTA.empieza[esc.donde] || FRASES_FIESTA.empieza.plaza; ctx.nota?.(t[0], t[1], true); }
    if (enFiesta && esc.brindis && brindisDicho !== d) { brindisDicho = d; ctx.nota?.(FRASES_FIESTA.brindis[0], FRASES_FIESTA.brindis[1], true); }
    void p;
  }

  // ---------------------------------------------------------------- caminar juntos
  let juntos = null;   // { clave, npc, gesto, hasta, yendose, t }
  const gestoDe = (clave) => (mundo.parejas || []).find((x) => x.clave === clave)?.gesto || 'cerca';
  function empezarJuntos(clave, horasDura = JUNTOS.dura) {
    const n = ctx.aldeaGente?.()?.personas?.get(clave)?.npc;
    if (!n || n.deVisita) return false;
    if (juntos) terminarJuntos(false);
    juntos = { clave, npc: n, gesto: gestoDe(clave), hasta: dia() * 24 + horas() + horasDura, yendose: 0, t: 0, ultimo: null };
    n.conVos = true; n.enCita = true; n.pose = null; n.asiento = undefined; n.soloCerca = 0; n.dormido = false; n.charlaVecinos = false;
    return true;
  }
  function terminarJuntos(decir = true) {
    const j = juntos;
    if (!j) return;
    const n = j.npc;
    n.gestoAmor = null;
    ctx.tomarMano?.(null);
    if (decir) ctx.nota?.(FRASES_JUNTOS.chau, '', false);
    // en el valle, se va caminando (que no desaparezca enfrente tuyo); en la aldea, sigue con lo suyo
    const js = jugadorPos();
    if (js && !enAldea(n.pos) && distanciaAldea(n.pos.x, n.pos.z, M) > 20) {
      const l = { x: centroAldea.x - n.pos.x, z: centroAldea.z - n.pos.z }, m = Math.hypot(l.x, l.z) || 1;
      n.camino = [{ x: n.pos.x + (l.x / m) * 40, z: n.pos.z + (l.z / m) * 40, cerca: 1 }];
      n.velocidad = 1.0;
      juntos = { ...j, yendose: performance.now() };
      return;
    }
    soltarNpc(n);
    juntos = null;
  }
  function soltarNpc(n) { ctx.tomarMano?.(null); n.conVos = false; n.enCita = false; n.gestoAmor = null; n.camino = []; n.velocidad = 0.85; }
  let congelado = false;   // (para las capturas: queda donde está)
  function actualizarJuntos(dt) {
    const j = juntos;
    if (!j || congelado) return;
    const n = j.npc, js = ctx.jugador?.();
    if (!activo() || !js) { soltarNpc(n); juntos = null; return; }
    if (j.yendose) {
      if (performance.now() - j.yendose > 15000 || dist(n.pos, js.pos) > 40 || !n.camino?.length) { soltarNpc(n); juntos = null; }
      return;
    }
    if (js.enTren || js.enKayak || js.montado || dist(n.pos, js.pos) > JUNTOS.lejos + 4) { terminarJuntos(true); return; }
    const yaw = js.yaw || 0, fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = -fz, rz = fx;
    // (va a tu derecha y te da la izquierda; la que lleva el mate en la izquierda, con el codo fijo, va a tu izquierda)
    const izq = !!n.brazos?.[1]?.userData?.muneca, signo = izq ? -1 : 1;
    const lado = (JUNTOS.lado[j.gesto] ?? 1) * signo, adelante = JUNTOS.adelante[j.gesto] ?? 0;
    const obj = { x: js.pos.x + rx * lado + fx * adelante, z: js.pos.z + rz * lado + fz * adelante };
    const vj = j.ultimo ? Math.hypot(js.pos.x - j.ultimo.x, js.pos.z - j.ultimo.z) / Math.max(1e-3, dt) : 0;
    j.ultimo = { x: js.pos.x, z: js.pos.z };
    const d = dist(n.pos, obj);
    if (d > JUNTOS.alcanzar) { n.pos.set(js.pos.x - fx * 1.5 + rx * lado, altura(js.pos.x - fx * 1.5 + rx * lado, js.pos.z - fz * 1.5 + rz * lado, n.pos.y), js.pos.z - fz * 1.5 + rz * lado); }
    n.velocidad = Math.min(5.5, Math.max(0.8, Math.min(vj, 6) * 0.95 + d * 1.6));
    n.camino = d > 0.1 ? [{ x: obj.x, z: obj.z, cerca: 0.08 }] : [];
    n.miraFinal = Math.atan2(fx, fz);
    if (d <= 0.1) n.rumboObjetivo = n.miraFinal;
    n.dormido = false; n.conVos = true; n.enCita = true; n.pose = null;
    // de la mano o del brazo: el brazo de tu lado (el izquierdo de ella, `brazos[1]`: va a tu derecha), cuando está a tu lado
    n.gestoAmor = j.gesto !== 'cerca' && d < 0.6 ? { tipo: j.gesto, lado: izq ? 0 : 1 } : null;
    // (y vos le das la mano: el brazo de su lado)
    ctx.tomarMano?.(j.gesto === 'mano' && d < 0.6 ? (izq ? 1 : 0) : null);
  }
  function revisarJuntos() {
    const j = juntos;
    if (!j || j.yendose) return;
    const p = progreso();
    const c = p.amor?.cita;
    const t = dia() * 24 + horas();
    if (!mundo.activo || t > j.hasta || horas() >= 22 || (c && c.clave === j.clave && c.estado === 'acordada' && c.dia === dia() && horas() >= c.desde - 0.5) || mundo.boda?.hoy) terminarJuntos(t > j.hasta || horas() >= 22);
  }
  // Para amor-juego.js: el menú de la charla («Salir a caminar juntos» / «Hasta acá, gracias»)
  function opcionCaminar(clave) {
    if (!activo() || !mundo.activo) return null;
    if (juntos && juntos.clave === clave && !juntos.yendose) return { id: 'amor:soltar', titulo: FRASES_JUNTOS.soltar };
    const f = progreso().amor?.personas?.[clave];
    if (!f || !['saliendo', 'novios', 'comprometidos', 'casados'].includes(f.etapa)) return null;
    if (progreso().amor?.cita?.clave === clave && progreso().amor.cita.estado === 'en-curso') return null;
    return { id: 'amor:caminar', titulo: FRASES_JUNTOS.opcion };
  }
  function caminarJuntos(clave) {
    repasar(true);
    const r = puedeCaminar(progreso(), clave, { dia: dia(), hora: horas(), aldea: progreso().aldea });
    if (!r.ok) return { ok: false, renglones: [FRASES_JUNTOS.no[r.motivo] || FRASES_JUNTOS.no.no] };
    const et = progreso().amor.personas[clave].etapa;
    if (!empezarJuntos(clave)) return { ok: false, renglones: [FRASES_JUNTOS.no.no] };
    return { ok: true, renglones: [FRASES_JUNTOS.si[et] || FRASES_JUNTOS.si.saliendo] };
  }
  function soltarJuntos(clave) {
    if (!juntos || juntos.clave !== clave) return { ok: false, renglones: [] };
    terminarJuntos(false);
    return { ok: true, renglones: [FRASES_JUNTOS.chau] };
  }
  // Para amor-juego.js: la cita y el casamiento los hace el mundo (ella va caminando; ver destinoPareja)
  function llevar(clave) {
    if (!activo()) return false;
    const n = ctx.aldeaGente?.()?.personas?.get(clave)?.npc;
    if (!n) return false;
    if (juntos?.clave === clave) { soltarNpc(n); juntos = null; }
    ctx.aldeaGente?.()?.apurar?.();
    return true;
  }
  function soltar(clave) {
    // terminó la cita (y la sobremesa): si estás cerca, vuelven juntos (el día del casamiento, no: sigue la fiesta)
    if (!activo() || fiesta?.dia === dia()) return;
    const n = ctx.aldeaGente?.()?.personas?.get(clave)?.npc, js = jugadorPos();
    repasar(true);
    if (n && js && dist(n.pos, js) < JUNTOS.despues && !progreso().amor?.cita && horas() < 21.5) empezarJuntos(clave, 0.75);
  }

  // ---------------------------------------------------------------- la mañana después
  let mananaDicha = 0, sonrie = null;
  function actualizarManana() {
    const p = progreso(), d = dia(), h = horas();
    const niki = Number(p.amor?.niki) || 0, conv = mundo.convivencia;
    // (esa mañana, ella anda sonriendo)
    const ellaN = conv ? ctx.aldeaGente?.()?.personas?.get(conv.con)?.npc : null;
    const deBuenAnimo = !!ellaN && niki > 0 && d === niki + 1 && h < 12;
    if (sonrie && (sonrie !== ellaN || !deBuenAnimo)) { if (sonrie.__gesto === 'sonrisa') sonrie.__gesto = null; sonrie = null; }
    if (deBuenAnimo && !ellaN.__gesto) { ellaN.__gesto = 'sonrisa'; sonrie = ellaN; }
    if (!conv || niki <= 0 || d !== niki + 1 || h < 7 || h >= 10 || mananaDicha === d) return;
    // (cuando estás en casa: dormiste ahí)
    const js = jugadorPos();
    const casa = conv.donde === 'refugio' ? refugio() : marcoEdificio(conv.edificio);
    if (!js || !casa || dist(js, casa) > 14) return;
    mananaDicha = d;
    const f = FRASES_MANANA[conv.donde] || FRASES_MANANA.refugio;
    const ella = nombreCorto(conv.con) || '';
    ctx.nota?.(f[0].replace('{ella}', ella), f[1], true);
  }

  // ---------------------------------------------------------------- cada cuadro
  let acum = 0;
  function apagar() {
    for (const id of [...figuras.keys()]) quitarFigura(id);
    if (juntos) { soltarNpc(juntos.npc); juntos = null; }
    if (madreConBebe) { bebeEnBrazos(madreConBebe, false); madreConBebe = null; }
    for (const n of copas) darCopa(n, false);
    quitarCuarto(); quitarCosas(); quitarMesa(); callar();
    if (anillo.malla) { anillo.malla.parent?.remove(anillo.malla); anillo.malla.geometry.dispose(); anillo.malla = null; anillo.estado = ''; }
  }
  let prendido = false;
  function actualizar(dt) {
    actualizarJuntos(dt);
    avanzarArmado();
    acum += dt;
    if (acum < 0.5) return;
    acum = 0;
    repasar(true);
    if (!mundo.activo) { if (prendido) { apagar(); prendido = false; } return; }
    prendido = true;
    revisarJuntos();
    actualizarHijos();
    actualizarCuarto();
    actualizarCosas();
    actualizarAnillo();
    actualizarBoda();
    actualizarMusica();
    actualizarManana();
  }

  return {
    actualizar, destino, llevar, soltar, caminar: caminarJuntos, soltarJuntos, opcionCaminar,
    // para las pruebas y las capturas
    estado: () => ({
      activo: mundo.activo, escena: esc ? { fase: esc.fase, donde: esc.donde, brindis: esc.brindis, personas: [...esc.personas.keys()], ella: esc.ella?.clave || null } : null,
      fiesta, juntos: juntos ? { clave: juntos.clave, gesto: juntos.gesto, yendose: !!juntos.yendose } : null,
      figuras: [...figuras.values()].map((f) => ({ id: f.id, lista: !!f.npc, x: f.npc?.pos.x, z: f.npc?.pos.z, dormido: !!f.npc?.dormido, pose: f.npc?.pose || null, plan: f.plan.map((q) => q.tipo) })),
      cuarto: cuarto.grupo ? { casa: cuarto.casa, firma: cuarto.firma, x: cuarto.mc.x, z: cuarto.mc.z, bebe: !!cuarto.bebe?.visible } : null,
      cosas: cosas.grupo ? { firma: cosas.firma, desayuno: !!cosas.desayuno?.visible } : null,
      anillo: anillo.malla ? { estado: anillo.estado, x: anillo.malla.position.x, z: anillo.malla.position.z } : null,
      mesa: !!mesaFiesta.malla, musica: !!musica.s, copas: [...copas].filter((n) => n.__copa?.visible).length,
      bebeEnBrazos: !!madreConBebe,
    }),
    figura: (id) => figuras.get(id)?.npc || null,
    puntoCuarto: (nombre) => (cuarto.mc ? puntoCuarto(cuarto.mc, nombre) : null),
    marcos, apagar, congelar: (si) => { congelado = !!si; }, empezarJuntos,
  };
}
