// 3.7.4: la vida social en el juego: junta las reglas (vecindad-social.js) con lo que se ve y se oye. Sin three ni DOM
// (se prueba en Node con figuras de mentira): las burbujas, las animaciones, tus manos y las voces llegan por `ctx`.
//   · la rueda: las opciones nuevas de cada vecino, su relación con vos, su humor y su deseo (`opciones`, `info`);
//   · una interacción elegida en la rueda (`interactuar`): la prueba (sale bien o mal según el humor y la relación), la
//     animación de los dos (el vecino y tus manos), la emoción arriba de la cabeza, la burbuja con su renglón y la voz;
//   · lo que dicen (vos charlando con un vecino, o ellos entre ellos): la burbuja con el ícono del tema, el renglón corto
//     y el balbuceo con la voz de cada uno (`decir`);
//   · entre vecinos, por su cuenta: de a dos, quietos y cerca tuyo, se abrazan, discuten, se ríen, bailan o juegan a las
//     cartas (`entreVecinos`), según el ritmo de la aldea;
//   · la iniciativa: un vecino que te quiere decir algo camina hacia vos, te saluda con su burbuja y el aviso dice «te
//     quiere decir algo» (E); no corta lo que estés haciendo (el aviso es el de siempre, sólo cuando lo mirás).
// `ctx`: { social (el módulo de reglas), progreso(), dia(), hora(), clima(), ritmo(), desafio(), jugador() ({ x, z }),
//   gente() (las figuras), npcDe(clave), claveDe(npc), hablandoCon(), mundo ({ burbuja, emocion, quitar }), anim
//   ({ empezar(g, id, op), terminar(g) }), manos ({ empezar(id) }), voz(npc, texto, { cerca }), nota(t, sub) }.
import { iconoDeTexto, iconoDeEmocion, renglonCorto, relacionVista, menuParaRueda } from './social-rueda.js';

export const SOCIAL = {
  cadaParejas: 2.5,       // cada cuánto se busca quién charla entre ellos (s)
  lejosParejas: 26,       // sólo cerca tuyo (m)
  juntos: 3.6,            // a esta distancia (o menos) dos vecinos quietos pueden interactuar
  descansoPersona: 24,    // después de una, cada uno espera esto (s)
  parejas: { tranquilo: 1, normal: 3, animado: 5 },
  cadaIniciativa: 9,      // cada cuánto se pregunta si alguien te quiere decir algo (s)
  esperaIniciativa: { tranquilo: 60, normal: 40, animado: 25 },   // entre una y otra (s; las reglas además esperan horas del juego)
  lejosIniciativa: 24,    // te ve desde acá
  aburre: 30,             // si no le hacés caso, se vuelve a lo suyo (s)
  cercaVoz: 14,           // la voz de los demás, sólo de cerca (m)
};

const seguro = (f, d = null) => { try { const r = f(); return r === undefined ? d : r; } catch { return d; } };
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const ICONO_TIPO = { saludo: 'chau', saludar: 'chau', chisme: 'charla', invita: 'mate', invitar: 'mate', ayuda: 'mano', pedir: 'mano', regalo: 'regalo', pregunta: 'pregunta' };

export function crearSocialJuego(ctx) {
  const S = ctx.social || {};
  const progreso = () => ctx.progreso?.() || {};
  let semilla = 1;
  const contexto = (extra = {}) => ({ dia: ctx.dia?.() || 1, hora: ctx.hora?.() || 12, clima: ctx.clima?.() || null, ritmo: ctx.ritmo?.() || 'normal', romance: ctx.romance?.() !== false, nombre: ctx.apodo?.() || null, semilla: semilla++, ...extra });
  const dia = () => ctx.dia?.() || 1;
  const claveDe = (npc) => (npc ? ctx.claveDe?.(npc) || null : null);
  const ritmo = () => { const r = ctx.ritmo?.(); return r === 'tranquilo' || r === 'animado' ? r : 'normal'; };

  // ---------------------------------------------------------------- la rueda
  function opciones(npc, menu = null) {
    const k = claveDe(npc);
    if (!k || ctx.desafio?.() || typeof S.opcionesRueda !== 'function') return [];
    const r = seguro(() => S.opcionesRueda(k, progreso(), contexto({ menu: menuParaRueda(menu) })), []);
    return Array.isArray(r) ? r : [];
  }
  function info(npc) {
    const k = claveDe(npc);
    if (!k || ctx.desafio?.()) return null;
    const rel = relacionVista(seguro(() => S.relacionDe?.(k, progreso(), contexto()), null));
    const humor = seguro(() => S.humorDe?.(k, progreso(), dia(), contexto()), null);
    const deseo = seguro(() => S.deseoDe?.(k, progreso(), dia()), null);
    const icDeseo = deseo ? seguro(() => S.iconoDeDeseo?.(deseo), null) : null;
    return { clave: k, relacion: rel, emocion: iconoDeEmocion(humor?.emocion), motivo: humor?.motivo ? String(humor.motivo) : '', deseo: deseo?.texto ? String(deseo.texto) : '', iconoDeseo: icDeseo || 'estrella' };
  }

  // ---------------------------------------------------------------- una interacción con vos
  // Devuelve { renglones, exito, cierra, emocion, anim } (o null si no se pudo)
  function interactuar(npc, id) {
    const k = claveDe(npc);
    if (!k || typeof S.probarInteraccion !== 'function') return null;
    const def = S.INTERACCIONES?.[id] || null;
    const r = seguro(() => S.probarInteraccion(k, id, progreso(), contexto()), null);
    if (!r) return null;
    const re = r.reaccion || {};
    if (!re.animEl && !re.renglon) return null;
    const animEl = re.animEl || 'negar';
    const j = ctx.jugador?.();
    const conVos = j ? { x: j.x, z: j.z } : null;
    ctx.anim?.empezar(npc, animEl, { hacia: conVos, cerca: 0.85, rol: 'el' });
    const yo = def?.anim?.yo;
    if (yo && r.motivo !== 'no-disponible') ctx.manos?.empezar(yo);
    if (animEl === 'cachetada-suave') ctx.manos?.cachetada?.();
    const emo = iconoDeEmocion(re.emocion);
    if (emo) ctx.mundo?.emocion(npc, emo, { dur: 6 });
    const renglon = re.renglon ? String(re.renglon) : '';
    const icono = re.burbuja || def?.icono || iconoDeTexto(renglon);
    ctx.mundo?.burbuja(npc, icono, { renglon: renglonCorto(renglon), dur: 4 });
    if (renglon) ctx.voz?.(npc, renglon, { cerca: true });
    const renglones = renglon ? [renglon] : ['…'];
    const ef = r.efectos && typeof r.efectos === 'object' ? r.efectos : {};
    return { renglones, exito: r.exito !== false, cierra: animEl === 'irse-ofendido', emocion: emo, anim: animEl, cosas: Array.isArray(ef.cosas) ? ef.cosas : [], otros: Array.isArray(ef.otros) ? ef.otros : [], relacion: r.relacion || null };
  }
  // Su deseo, si lo que hiciste lo cumple (regalar, invitar, dar una mano; las interacciones lo miran solas): el aviso,
  // la burbuja con la estrella y contento. Devuelve el renglón de las gracias (o null).
  function cumplir(npc, hecho) {
    const k = claveDe(npc);
    if (!k || typeof S.cumplirDeseo !== 'function' || ctx.desafio?.()) return null;
    const c = seguro(() => S.cumplirDeseo(k, progreso(), hecho, dia(), contexto()), null);
    if (!c?.ok) return null;
    ctx.mundo?.emocion(npc, 'contento', { dur: 6 });
    ctx.mundo?.burbuja(npc, 'estrella', { renglon: renglonCorto(c.renglon || ''), dur: 4 });
    ctx.nota?.(`Le cumpliste el deseo a ${npc.nombre || k}`, 'Se lo va a acordar');
    return c.renglon || null;
  }
  // Lo último que pasó con vos (para que lo comente al saludarte)
  function recuerdo(npc) {
    const k = claveDe(npc);
    if (!k || typeof S.recuerdoDe !== 'function' || ctx.desafio?.()) return null;
    return seguro(() => S.recuerdoDe(k, progreso(), dia())?.renglon, null) || null;
  }

  // ---------------------------------------------------------------- lo que dicen
  // `cerca`: charlando con vos (la voz sin lugar, enfrente); `renglon`: si va el renglón corto debajo de la burbuja
  function decir(npc, texto, { tema = null, renglon = true, cerca = false, icono = null } = {}) {
    if (!npc?.pos || !texto) return;
    const ic = icono || iconoDeTexto(texto, tema);
    ctx.mundo?.burbuja(npc, ic, { renglon: renglon ? renglonCorto(texto) : '', dur: Math.min(6, 2.4 + String(texto).length * 0.035) });
    const j = ctx.jugador?.();
    if (cerca || !j || dist(npc.pos, j) < SOCIAL.cercaVoz) ctx.voz?.(npc, texto, { cerca });
  }
  // Las charlas de la aldea (aldea-gente.js): al empezar, lo que hacen los dos primeros (entreVecinos)
  function alEmpezarCharla(npcs, tema = null) {
    const [a, b] = (npcs || []).filter((n) => n?.pos);
    if (!a || !b || ctx.desafio?.()) return;
    hacerEntre(a, b, false);
  }

  // ---------------------------------------------------------------- entre ellos, por su cuenta
  const descanso = new Map();   // npc → hasta (s)
  const parejas = [];           // [{ a, b, hasta }]
  let reloj = 0, acumParejas = 0;
  function hacerEntre(a, b, conRenglon = true) {
    const ka = claveDe(a), kb = claveDe(b);
    if (!ka || !kb) return null;
    const r = seguro(() => S.entreVecinos?.(ka, kb, progreso(), contexto({ lugar: ctx.lugar?.(a) || null })), null);
    if (!r) return null;
    ctx.anim?.empezar(a, r.animA || 'charlar', { hacia: b.pos, rol: 'a' });
    ctx.anim?.empezar(b, r.animB || 'charlar', { hacia: a.pos, rol: 'b' });
    const temas = Array.isArray(r.burbujas) ? r.burbujas.filter((x) => typeof x === 'string') : [];
    const renglon = conRenglon && r.renglon ? String(r.renglon) : '';
    const habla = r.quien && r.quien === kb ? b : a, otro = habla === a ? b : a;
    if (temas[0] || renglon) ctx.mundo?.burbuja(habla, temas[0] || iconoDeTexto(renglon), { renglon: renglonCorto(renglon), dur: 4 });
    if (temas[1] || temas[0]) setTimeoutSeguro(() => ctx.mundo?.burbuja(otro, temas[1] || temas[0], { dur: 3.4 }), 900);
    const emo = { discutir: 'enojado', reirse: 'risa', abrazarse: 'contento', bailar: 'contento', chisme: 'sorpresa', saludarse: 'contento' }[r.id] || null;
    if (emo) { ctx.mundo?.emocion(a, emo, { dur: 5 }); ctx.mundo?.emocion(b, emo === 'sorpresa' ? 'risa' : emo, { dur: 5 }); }
    const j = ctx.jugador?.();
    if (renglon && j && dist(habla.pos, j) < SOCIAL.cercaVoz) ctx.voz?.(habla, renglon, {});
    return r;
  }
  const setTimeoutSeguro = (f, ms) => (typeof setTimeout === 'function' ? setTimeout(() => seguro(f), ms) : f());
  const libre = (n, hablando) => !!n?.pos && !n.dormido && n.g?.visible !== false && !(n.camino && n.camino.length) && !(n.vel > 0.05) && !n.animSocial && !n.charlaVecinos
    && n !== hablando && !n.enCita && !n.conVos && !n.deVisita && !n.pose && !n.aBordo && !n.llegando && !n.__iniciativa && (n.claveAldea || claveDe(n));
  function buscarParejas() {
    for (let i = parejas.length - 1; i >= 0; i--) if (parejas[i].hasta <= reloj) parejas.splice(i, 1);
    const tope = SOCIAL.parejas[ritmo()];
    if (parejas.length >= tope) return;
    const j = ctx.jugador?.();
    if (!j) return;
    const hablando = ctx.hablandoCon?.();
    const lista = [];
    for (const n of ctx.gente?.() || []) {
      if (!libre(n, hablando) || (descanso.get(n) || 0) > reloj) continue;
      if (dist(n.pos, j) > SOCIAL.lejosParejas) continue;
      lista.push(n);
    }
    for (let i = 0; i < lista.length && parejas.length < tope; i++) {
      const a = lista[i];
      if ((descanso.get(a) || 0) > reloj) continue;
      let b = null, db = SOCIAL.juntos;
      for (let k = i + 1; k < lista.length; k++) {
        const c = lista[k];
        if ((descanso.get(c) || 0) > reloj) continue;
        const d = dist(a.pos, c.pos);
        if (d < db) { db = d; b = c; }
      }
      if (!b) continue;
      const r = hacerEntre(a, b, true);
      if (!r) continue;
      const dur = Math.max(a.animSocial?.dur || 3, b.animSocial?.dur || 3) + 1;
      parejas.push({ a, b, hasta: reloj + dur });
      descanso.set(a, reloj + SOCIAL.descansoPersona); descanso.set(b, reloj + SOCIAL.descansoPersona);
    }
  }

  // ---------------------------------------------------------------- la iniciativa
  let pendiente = null;   // { npc, clave, r, hasta, origen, llego }
  let acumIni = 0, proximaIni = 8;
  function buscarIniciativa() {
    if (pendiente || typeof S.iniciativa !== 'function') return;
    const j = ctx.jugador?.();
    const hablando = ctx.hablandoCon?.();
    if (!j || hablando) return;
    let mejor = null, dm = SOCIAL.lejosIniciativa;
    for (const n of ctx.gente?.() || []) {
      if (!n.claveAldea || !libre(n, hablando)) continue;
      const d = dist(n.pos, j);
      if (d < dm && d > 2.5) { dm = d; mejor = n; }
    }
    if (!mejor) return;
    const k = claveDe(mejor);
    if (!k) return;
    const r = seguro(() => S.iniciativa(k, progreso(), contexto({ libre: true })), null);
    if (!r || !Array.isArray(r.renglones) || !r.renglones.length) return;
    // camina hacia vos (hasta un par de metros; cerca tuyo gente.js lo frena y te mira) y te saluda con su burbuja
    const origen = { x: mejor.pos.x, z: mejor.pos.z };
    const dx = j.x - origen.x, dz = j.z - origen.z, d = Math.hypot(dx, dz) || 1;
    mejor.camino = [{ x: j.x - (dx / d) * 1.8, z: j.z - (dz / d) * 1.8, cerca: 0.6 }];
    mejor.__iniciativa = true;
    pendiente = { npc: mejor, clave: k, r, hasta: reloj + SOCIAL.aburre + d / 0.8, origen, llego: false };
    ctx.mundo?.burbuja(mejor, 'exclamacion', { dur: 3 });
  }
  function revisarIniciativa() {
    const p = pendiente;
    if (!p) return;
    const n = p.npc, j = ctx.jugador?.();
    if (!n?.pos || n.dormido || !j) { soltarIniciativa(false); return; }
    if (!p.llego && dist(n.pos, j) < 7) {
      p.llego = true;
      const saludo = p.r.renglones[0];
      ctx.mundo?.burbuja(n, p.r.burbuja || ICONO_TIPO[p.r.tipo] || iconoDeTexto(saludo), { renglon: '¡Eh! ¿Tenés un minuto?', dur: 6 });
      ctx.voz?.(n, '¡Eh! ¿Tenés un minuto?', {});
      ctx.anim?.empezar(n, 'saludar', { rol: 'el' });
    } else if (p.llego && (reloj % 7) < 0.6 && !n.animSocial) ctx.mundo?.burbuja(n, p.r.burbuja || ICONO_TIPO[p.r.tipo] || 'charla', { dur: 2.5 });
    if (reloj > p.hasta) soltarIniciativa(true);
  }
  function soltarIniciativa(volver) {
    const p = pendiente;
    if (!p) return;
    pendiente = null;
    proximaIni = reloj + SOCIAL.esperaIniciativa[ritmo()];
    if (p.npc) {
      p.npc.__iniciativa = false;
      // vuelve a donde estaba (aldea-gente.js lo deja ahí, mirando para donde miraba)
      if (volver && p.npc.pos) p.npc.camino = [{ x: p.origen.x, z: p.origen.z }];
    }
  }
  // ¿Éste te quiere decir algo? (el aviso y la tecla E)
  const quiereDecir = (npc) => !!pendiente && pendiente.npc === npc;
  // Le hablaste: lo que te quería decir (y no vuelve a su lugar hasta que termine la charla)
  function tomarIniciativa(npc) {
    if (!quiereDecir(npc)) return null;
    const p = pendiente;
    soltarIniciativa(false);
    const id = typeof p.r.id === 'string' ? p.r.id : null;
    const animId = p.r.animEl || null;
    const j = ctx.jugador?.();
    if (animId) ctx.anim?.empezar(npc, animId, { hacia: j ? { x: j.x, z: j.z } : null, cerca: 0.85, rol: 'el' });
    vuelve = { npc, origen: p.origen };
    return { renglones: p.r.renglones.map(String), id, tipo: p.r.tipo || null, origen: p.origen };
  }
  // Terminó la charla con el que te vino a buscar: vuelve a donde estaba
  let vuelve = null;
  function alCerrarCharla(npc) {
    if (!vuelve || vuelve.npc !== npc) return;
    if (npc?.pos && !(npc.camino && npc.camino.length)) npc.camino = [{ x: vuelve.origen.x, z: vuelve.origen.z }];
    vuelve = null;
  }

  // ---------------------------------------------------------------- cada cuadro
  function actualizar(dt) {
    if (ctx.desafio?.()) { if (pendiente) soltarIniciativa(true); return; }
    reloj += Math.max(0, Math.min(0.25, dt || 0));
    acumParejas += dt;
    if (acumParejas >= SOCIAL.cadaParejas) { acumParejas = 0; seguro(buscarParejas); }
    acumIni += dt;
    if (acumIni >= SOCIAL.cadaIniciativa && reloj >= proximaIni) { acumIni = 0; seguro(buscarIniciativa); }
    seguro(revisarIniciativa);
    // los que se pelearon o se ignoraron no quedan en una pareja vieja
    if (descanso.size > 80) for (const [n, h] of descanso) if (h <= reloj) descanso.delete(n);
  }
  return {
    opciones, info, interactuar, cumplir, recuerdo, decir, alEmpezarCharla, actualizar, quiereDecir, tomarIniciativa, alCerrarCharla,
    // (para las pruebas: forzar la iniciativa o una pareja)
    forzarIniciativa: () => { proximaIni = 0; acumIni = SOCIAL.cadaIniciativa; seguro(buscarIniciativa); return !!pendiente; },
    pendiente: () => (pendiente ? { clave: pendiente.clave, llego: pendiente.llego, tipo: pendiente.r?.tipo || null } : null),
    parejas: () => parejas.map((p) => [claveDe(p.a) || p.a.clave, claveDe(p.b) || p.b.clave]),
    hacerEntre: (a, b) => hacerEntre(a, b, true),
    buscarParejas: () => { acumParejas = SOCIAL.cadaParejas; seguro(buscarParejas); return parejas.length; },
  };
}
