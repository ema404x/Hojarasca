// 4.31.0 (B): el pueblo y la gente, al detalle, en el juego (las reglas y los textos en pueblo-detalles.js; las poses en
// pueblo-detalles-pose.js). main.js lo arma en el Relax, lo llama en cada cuadro (`actualizar`) y, para la E y el aviso, usa
// `accion(js)` (como los demás módulos: una sola función, la misma prioridad para los dos).
//
// Rendimiento: lejos de la aldea no hace nada; la gente de alrededor (a menos de 40 m) se mira cuatro veces por segundo; quién está
// en cada casa, una vez por segundo. Sin luces, mallas ni programas nuevos: la luz y el humo de cada casa los aplica aldea-mundo.js
// con lo que ya tenía (`luz(id)`, `humo(id)`), las poses las hace gente.js con las piezas de la figura, las burbujas son las de la
// vida social y los sonidos son de síntesis, bajitos, con las piezas de sonido.js.
//
// `ctx`: { progreso(), desafio(), jugador() → estado, camara() → { position }, gente() → [figuras], aldeaGente(), aldeaMundo(),
//   puertas(), animales(), sonido, ambiente() → { lluvia, invierno }, dentroDe(pos) → id del edificio (o null), distanciaAldea(x, z),
//   hablandoCon() → figura, burbuja(npc, icono, renglon), voz(npc, texto), anim(npc, id), leer({ quien, que, partes, id }),
//   decir(texto), nota(t, sub), guardar(), nombreDe(k) }
import { PUEBLO, saludoPara, leToca, quejaChoque, animQueja, loChocaste, climaDeGente, gestoDeClima, ocupacion, luzDeEdificio, hayHumo, respuestaPuerta, seGolpea, quejaLuz, tieneLlave, CAMPANITA, bienvenida, campanaEscuela, lecturaCartel, mimoPerro, sanearPueblo, cambiarLuz, volvieron } from './pueblo-detalles.js';
import { DUR_SACUDIR } from './pueblo-detalles-pose.js';
import { EDIFICIOS_ALDEA } from './aldea.js';
import { nombreCortoDe } from './aldea-vida.js';

const LEJOS_ALDEA = 60;   // más lejos que esto del borde de la aldea, nada
const deEdificio = (p) => (typeof p?.duenio === 'string' && p.duenio.startsWith('aldea:') ? p.duenio.slice(6) : null);

export function crearPuebloDetalles(ctx) {
  const info = { saludos: 0, quejas: 0, golpes: 0, campanitas: 0, campanas: 0, caricias: 0, carteles: 0, llaves: 0, quejasLuz: 0, sacudidas: 0, tapados: 0, frotando: 0, ms: 0, msMax: 0 };
  let t = 0, acum = 0, acumOcup = 9, ocup = new Map(), horaAntes = null, ultimoUno = -Infinity;
  const saludados = new WeakMap(), chocados = new WeakMap(), adentroDe = new WeakMap(), conDetalle = new Set();
  const golpeadas = new Map();     // edificio → t del golpe
  const campanitas = new Map();    // edificio → t de la última
  const pendientes = [];           // { t, hacer }
  let antes = null, dentroAntes = null, n = 0;
  // tu velocidad reciente (cuadro a cuadro, con memoria de medio segundo): al chocar con alguien te frenás en seco, y mirando cada 0,25 s
  // ya estarías quieto. `mov`: hacia dónde ibas
  const mov = { v: 0, x: 0, z: 0 };
  const prog = () => ctx.progreso?.() || null;
  const estado = () => { const p = prog(); if (!p) return null; if (!p.puebloDetalles || typeof p.puebloDetalles !== 'object') p.puebloDetalles = sanearPueblo(p.puebloDetalles, p.dia); return p.puebloDetalles; };
  const activo = () => !!prog()?.aldea && !ctx.desafio?.();
  const S = () => (ctx.sonido?.ctx ? ctx.sonido : null);
  const despues = (seg, hacer) => pendientes.push({ t: t + seg, hacer });
  const nombre = (k) => ctx.nombreDe?.(k) || nombreCortoDe(k) || k;
  // la figura de alguien, si ya está armada (sin armarla: eso lo decide aldea-gente.js)
  const figura = (k) => (ctx.gente?.() || []).find((g) => g && (g.claveAldea === k || g.clave === k)) || null;

  // ------------------------------------------------ los sonidos (síntesis, bajitos)
  function campanita(pos) {
    const s = S(); if (!s) return;
    const d = s.fuente(pos, 0.9, 0.35);
    for (const [c, f] of [[0, 2350], [0.11, 2620]]) for (const [r, v] of [[1, 0.016], [2.76, 0.006], [5.4, 0.003]]) s.tono({ frec: f * r, dur: 0.7, vol: v, destino: d, cuando: c, ataque: 0.002 });
  }
  function campanaDeMano(pos, golpes = 8) {
    const s = S(); if (!s) return;
    const d = s.fuente(pos, 1.4, 0.7);
    for (let i = 0; i < golpes; i++) for (const [r, v] of [[1, 0.012], [2.4, 0.005], [3.9, 0.002]]) s.tono({ frec: 1480 * r, dur: 0.5, vol: v, destino: d, cuando: i * 0.19, ataque: 0.002 });
  }
  function golpesEnLaPuerta(pos) {
    const s = S(); if (!s) return;
    const d = s.fuente(pos, 1, 0.5);
    for (let i = 0; i < 3; i++) s.impacto?.('hueco', { tamaño: 1.7, dureza: 0.75, fuerza: 0.8, vol: 0.16, destino: d, cuando: i * 0.24, capasMax: 2 });
  }
  function llave(pos) {
    const s = S(); if (!s) return;
    const d = s.fuente(pos, 0.8, 0.2);
    s.golpeRuido?.({ dur: 0.035, frec: 3200, q: 2, vol: 0.06, destino: d });
  }
  function contento(pos) {
    const s = S(); if (!s) return;
    const d = s.fuente(pos, 0.8, 0.3);
    for (const c of [0, 0.32]) s.tono({ frec: 980, fin: 1420, dur: 0.24, vol: 0.01, destino: d, cuando: c, ataque: 0.02 });
  }

  // ------------------------------------------------ hacia dónde mirás
  function ojo() {
    const js = ctx.jugador?.();
    const c = ctx.camara?.()?.position;
    const yaw = js?.yaw || 0, pitch = js?.pitch || 0;
    return { x: c?.x ?? js.pos.x, y: c?.y ?? js.pos.y + 1.6, z: c?.z ?? js.pos.z, fx: -Math.sin(yaw) * Math.cos(pitch), fy: Math.sin(pitch), fz: -Math.cos(yaw) * Math.cos(pitch) };
  }
  // el coseno entre adonde mirás y el punto (en el espacio) y la distancia
  function mirando(o, p, y = null) {
    const dx = p.x - o.x, dy = (y ?? p.y ?? o.y) - o.y, dz = p.z - o.z, d = Math.hypot(dx, dy, dz) || 1e-6;
    return { cos: (dx * o.fx + dy * o.fy + dz * o.fz) / d, d, dh: Math.hypot(dx, dz) };
  }

  // ------------------------------------------------ cada cuadro
  function actualizar(dt) {
    if (!activo()) return;
    const t0 = performance.now();
    t += dt;
    const js = ctx.jugador?.();
    const p = prog();
    if (!js || !p) return;
    for (let i = pendientes.length - 1; i >= 0; i--) if (t >= pendientes[i].t) { const q = pendientes.splice(i, 1)[0]; try { q.hacer(); } catch (e) { console.warn('pueblo', e); } }
    // la campana de la escuela (con la aldea a tiro de oído)
    const h = p.horas;
    if (horaAntes !== null && h >= horaAntes) {
      const toque = campanaEscuela(horaAntes, h, p.dia, p.aldea);
      const esc = toque ? ctx.aldeaMundo?.()?.puntosEdificio?.('escuela') : null;
      if (toque && esc?.sitio && Math.hypot(esc.sitio.x - js.pos.x, esc.sitio.z - js.pos.z) < 160) { campanaDeMano({ x: esc.sitio.x, y: esc.sitio.y + 2.5, z: esc.sitio.z }); info.campanas++; info.ultimaCampana = toque.que; }
    }
    horaAntes = h;
    const lejos = ctx.distanciaAldea ? ctx.distanciaAldea(js.pos.x, js.pos.z) > LEJOS_ALDEA : false;
    // quién está en cada casa (una vez por segundo; también de lejos: la luz y el humo se ven desde el valle)
    acumOcup += dt;
    if (acumOcup >= 1) {
      acumOcup = 0;
      const AG = ctx.aldeaGente?.();
      ocup = ocupacion(p.aldea, h, p.dia, { destinoDe: AG?.destinoDe ? (k) => AG.destinoDe(k) : null });
      const e = estado();
      const esperan = new Set(pendientes.filter((q) => q.luz).map((q) => q.luz));
      if (e && Object.keys(e.apagadas).length) {
        const guardadas = Object.fromEntries(Object.entries(e.apagadas).filter(([k]) => esperan.has(k)));
        for (const k of Object.keys(guardadas)) delete e.apagadas[k];
        if (volvieron(e, ocup).length) ctx.guardar?.();
        Object.assign(e.apagadas, guardadas);
      }
    }
    if (lejos) { if (conDetalle.size) { for (const g of conDetalle) g.__detalle = null; conDetalle.clear(); } return; }
    // la campanita al entrar a un local
    const dentro = ctx.dentroDe?.(js.pos) || null;
    if (dentro && dentro !== dentroAntes && CAMPANITA.has(dentro) && t - (campanitas.get(dentro) ?? -Infinity) > PUEBLO.campanita.cada) {
      campanitas.set(dentro, t);
      campanita({ x: js.pos.x, y: js.pos.y + 2, z: js.pos.z });
      info.campanitas++;
      const o = ocup.get(dentro), quien = o?.despiertos?.[0];
      const f = quien ? figura(quien) : null;
      if (f && f.g?.visible) { const txt = bienvenida(n++); despues(0.6, () => { ctx.burbuja?.(f, 'saludo', txt); ctx.voz?.(f, txt); }); }
    }
    dentroAntes = dentro;
    if (antes && dt > 0) {
      const dx = js.pos.x - antes.x, dz = js.pos.z - antes.z, vi = Math.hypot(dx, dz) / dt;
      if (vi > 0.3 && vi < 30) { mov.x = dx / (vi * dt); mov.z = dz / (vi * dt); }
      mov.v = Math.max(vi < 30 ? vi : 0, mov.v - dt * 6);
    }
    antes = { x: js.pos.x, z: js.pos.z };
    acum += dt;
    if (acum < PUEBLO.revisar) { medir(t0); return; }
    acum = 0;
    // tu velocidad (para el choque)
    const v = mov.v;
    const amb = ctx.ambiente?.() || {};
    const noche = h >= 20.5 || h < 6 ? 1 : 0;
    const clima = climaDeGente(amb.lluvia || 0, amb.invierno || 0, noche);
    const o = ojo();
    const hablando = ctx.hablandoCon?.();
    const AM = ctx.aldeaMundo?.();
    for (const g of ctx.gente?.() || []) {
      if (!g?.pos || !g.g) continue;
      const d = Math.hypot(g.pos.x - js.pos.x, g.pos.z - js.pos.z);
      const fuera = !g.g.visible || g.dormido || g.aBordo || g.enBase || d > PUEBLO.lejos;
      if (fuera) { if (g.__detalle) { g.__detalle = null; conDetalle.delete(g); } continue; }
      // el gesto del clima (y sacudirse la nieve al entrar)
      const andando = g.vel > 0.05;
      const techo = !!(AM?.bajoCubierta?.(g.pos) || AM?.adentro?.(g.pos));
      const gesto = g.enEscena ? null : gestoDeClima(clima, { andando, bajoTecho: techo, pose: g.pose, charlando: hablando === g });
      if (gesto !== g.__detalle) { g.__detalle = gesto; if (gesto) { conDetalle.add(g); if (gesto === 'taparse') info.tapados++; else info.frotando++; } else conDetalle.delete(g); }
      const ed = AM?.adentro?.(g.pos)?.id || null, previo = adentroDe.get(g);
      if (ed && previo === null && clima === 'nieve' && !g.enEscena) { g.__sacude = (Number(g.fase) || 0) + DUR_SACUDIR; info.sacudidas++; }
      adentroDe.set(g, ed);
      if (g.enEscena || g.deVisita || hablando === g || js.enTren || js.sentado) continue;
      // el choque: le pasaste por encima corriendo
      const hx = g.pos.x - js.pos.x, hz = g.pos.z - js.pos.z;
      const acerca = v > 0 && (mov.x * hx + mov.z * hz) / (d || 1e-6) > 0.2;
      const ch = chocados.get(g) || { t: -Infinity, veces: 0 };
      if (loChocaste(d, v, acerca) && t - ch.t > PUEBLO.choque.cada) {
        ch.veces = t - ch.t < PUEBLO.choque.memoria ? ch.veces + 1 : 1; ch.t = t; chocados.set(g, ch);
        const txt = quejaChoque(ch.veces, n++);
        ctx.anim?.(g, animQueja(ch.veces), { hacia: js.pos });
        ctx.burbuja?.(g, 'queja', txt); ctx.voz?.(g, txt);
        info.quejas++; info.ultimaQueja = txt;
        saludados.set(g, t);   // (no te saluda enseguida después de quejarse)
        continue;
      }
      // el saludo: cerca y mirándolo
      if (g.animSocial) continue;
      const m = mirando(o, g.pos, g.pos.y + 1.4);
      if (leToca(d, m.cos, t, saludados.get(g) ?? -Infinity, ultimoUno)) {
        saludados.set(g, t); ultimoUno = t;
        const txt = saludoPara(h, clima, n++, (g.g.scale?.y || 1) < 0.85);
        ctx.anim?.(g, 'saludar', { hacia: js.pos });
        ctx.burbuja?.(g, 'saludo', txt); ctx.voz?.(g, txt);
        info.saludos++; info.ultimoSaludo = txt;
      }
    }
    medir(t0);
  }
  function medir(t0) {
    const ms = performance.now() - t0;
    info.ms = ms; info.msMax = Math.max(info.msMax * 0.995, ms);
  }

  // ------------------------------------------------ la E
  // Lo que hay para hacer (o null): el perro de adelante, el cartel que mirás, la llave de la luz, golpear la puerta.
  function accion(js) {
    if (!activo() || !js?.pos || js.enTren || js.montado) return null;
    if (ctx.distanciaAldea && ctx.distanciaAldea(js.pos.x, js.pos.z) > 20) return null;
    const o = ojo(), p = prog();
    // el perro (a menos de 1,7 m y de frente)
    const perro = ctx.animales?.()?.perroCerca?.(js.pos, PUEBLO.perro.radio);
    if (perro && mirando(o, perro, (perro.y ?? js.pos.y) + 0.4).cos > 0.55) {
      return { tipo: 'perro', texto: `Acariciar a ${perro.nombre}`, hacer: () => {
        if (!ctx.animales?.()?.acariciar?.(perro.id, PUEBLO.perro.extra, js.pos)) return;
        contento({ x: perro.x, y: (perro.y ?? js.pos.y) + 0.5, z: perro.z });
        info.caricias++;
        ctx.nota?.(mimoPerro(perro.nombre, n++), 'Te va a seguir un rato');
      } };
    }
    const AM = ctx.aldeaMundo?.();
    // el cartel que mirás (de frente, hasta 5 m)
    let mejor = null;
    for (const id of Object.keys(EDIFICIOS_ALDEA)) {
      const pe = AM?.puntosEdificio?.(id === 'estacion-aldea' ? 'estacion' : id);
      for (const c of pe?.carteles || []) {
        const m = mirando(o, c);
        if (m.dh < 5 && m.cos > 0.975 && (!mejor || m.cos > mejor.cos)) mejor = { cos: m.cos, id, c };
      }
    }
    if (mejor) {
      const { id, c } = mejor;
      return { tipo: 'cartel', texto: 'Leer el cartel', hacer: () => {
        const dueno = EDIFICIOS_ALDEA[id]?.poblador || null;
        const o2 = ocup.get(id);
        const abierto = EDIFICIOS_ALDEA[id]?.rol === 'local' ? !!o2?.despiertos?.length && (!dueno || o2.despiertos.includes(dueno)) : null;
        const l = lecturaCartel(id, c.texto, { abierto, dia: p.dia });
        info.carteles++;
        ctx.leer?.({ quien: l.titulo, que: 'Cartel', partes: l.partes, id: `cartel-${id}`, despedida: 'Listo.' });
      } };
    }
    // la llave de la luz: adentro, a un costado de la puerta, mirándola
    const dentro = ctx.dentroDe?.(js.pos) || null;
    const pu = ctx.puertas?.();
    if (dentro && tieneLlave(dentro) && pu) {
      const q = pu.cerca(js.pos, 3);
      if (q && deEdificio(q) === dentro) {
        const ca = Math.cos(q.rot || 0), sa = Math.sin(q.rot || 0), lado = (q.ancho || 0.95) / 2 + 0.3;
        // a los dos costados de la puerta: el que queda del lado de adentro (más cerca tuyo)
        const pts = [1, -1].map((s) => ({ x: q.x + ca * lado * s, z: q.z - sa * lado * s, y: (q.y ?? js.pos.y) + 1.3 }));
        const m = pts.map((pt) => mirando(o, pt)).sort((a, b) => b.cos - a.cos)[0];
        const mPuerta = mirando(o, { x: q.x, z: q.z, y: (q.y ?? js.pos.y) + 1.1 });
        info.llaveVista = { dentro, cos: +m.cos.toFixed(3), dh: +m.dh.toFixed(2), puerta: +mPuerta.cos.toFixed(3) };   // (para las pruebas: lo último que se miró)
        if (m.dh < 2.4 && m.cos > 0.93 && m.cos > mPuerta.cos) {
          const apagada = Object.hasOwn(estado()?.apagadas || {}, dentro);
          return { tipo: 'llave', texto: apagada ? 'Prender la luz' : 'Apagar la luz', hacer: () => usarLlave(dentro, q) };
        }
      }
    }
    // golpear la puerta de una casa, desde afuera, cerrada
    if (pu) {
      const q = pu.cerca(js.pos, 2.6), id = deEdificio(q);
      if (q && id && seGolpea(id) && !(q.objetivo > 0.5) && dentro !== id && t - (golpeadas.get(id) ?? -Infinity) > PUEBLO.golpe.valido) {
        return { tipo: 'golpe', texto: 'Golpear la puerta', hacer: () => golpear(id, q) };
      }
    }
    return null;
  }
  function golpear(id, q) {
    golpeadas.set(id, t);
    golpesEnLaPuerta({ x: q.x, y: (q.y ?? 0) + 1.2, z: q.z });
    info.golpes++;
    const r = respuestaPuerta(id, ocup, prog()?.horas ?? 12, n++, nombre);
    info.ultimaRespuesta = r.tipo;
    despues(1.3, () => {
      ctx.decir?.(r.texto);
      const f = r.quien ? figura(r.quien) : null;
      if (f) { ctx.burbuja?.(f, r.tipo === 'abre' ? 'puerta' : 'z', r.texto.replace(/^[^«]*«|»$/g, '')); ctx.voz?.(f, r.texto); }
    });
    despues(5.5, () => ctx.decir?.(''));
  }
  function usarLlave(id, q) {
    const e = estado(), p = prog();
    if (!e) return;
    const apagada = cambiarLuz(e, id, p?.dia);
    llave({ x: q.x, y: (q.y ?? 0) + 1.3, z: q.z });
    info.llaves++;
    const o = ocup.get(id);
    if (apagada && o?.despiertos?.length) {
      // el que está adentro se queja y la vuelve a prender
      const quien = o.despiertos[0], f = figura(quien), txt = quejaLuz(n++);
      info.quejasLuz++; info.ultimaQuejaLuz = txt;
      despues(0.5, () => { if (f) { ctx.anim?.(f, 'quejarse', { hacia: ctx.jugador?.()?.pos }); ctx.burbuja?.(f, 'enojado', txt); ctx.voz?.(f, txt); } ctx.decir?.(`${nombre(quien)}: «${txt}»`); });
      pendientes.push({ t: t + PUEBLO.luz.vuelve, luz: id, hacer: () => { const e2 = estado(); if (e2 && Object.hasOwn(e2.apagadas, id)) { delete e2.apagadas[id]; llave({ x: q.x, y: (q.y ?? 0) + 1.3, z: q.z }); ctx.guardar?.(); } ctx.decir?.(''); } });
    }
    ctx.guardar?.();
  }

  return {
    actualizar, accion,
    // para aldea-mundo.js: la luz (0 a 1) y el humo de cada edificio
    luz: (id) => (activo() ? luzDeEdificio(id, ocup, estado()?.apagadas) : 1),
    humo: (id) => (activo() ? hayHumo(id, ocup) : true),
    // para las pruebas
    info: () => ({ ...info, ocupacion: Object.fromEntries([...ocup].map(([k, v]) => [k, { despiertos: v.despiertos.length, dormidos: v.dormidos.length }])), apagadas: { ...(estado()?.apagadas || {}) } }),
    reloj: () => t,
  };
}
