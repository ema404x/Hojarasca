// 3.1: los oficios en el juego (las reglas están en oficios.js): suma la experiencia de
// lo que hacés, avisa cuando subís de nivel, lleva la cuenta de lo remado y dibuja la
// pestaña «Oficios y pueblo» del cuaderno. Sin three: sólo el DOM del cuaderno.
import {
  ORDEN_OFICIOS, OFICIOS, XP, METROS_REMO, sanearOficios, sumarXp, nivelOficio, estadoOficio, rangoGeneral, acreditarOficios, esOficio,
} from './oficios.js';

export function crearOficiosUI(ctx) {
  let elegido = null;
  let ultimo = null;   // dónde estabas el cuadro anterior, para medir lo remado

  function oficios() {
    const p = ctx.progreso();
    if (!p.oficios || typeof p.oficios !== 'object') p.oficios = sanearOficios(p.oficios);
    return p.oficios;
  }
  const nivel = (id) => nivelOficio(oficios(), id);

  // Suma experiencia. Al subir de nivel: un aviso con el título nuevo y lo que ganaste.
  function ganar(id, cuanto) {
    if (!esOficio(id)) return null;
    const r = sumarXp(oficios(), id, cuanto);
    if (r.subio) {
      ctx.nota(`${r.titulo}`, `Nuevo nivel de ${OFICIOS[id].nombre.toLowerCase()} (${r.nivel}): ${r.habilidad.charAt(0).toLowerCase()}${r.habilidad.slice(1)}`, true);
      ctx.sonido?.anotar?.();
      ctx.alSubir?.(r);
    }
    return r;
  }

  // Una partida de antes de la 3.1: se le acredita una vez lo que ya había hecho.
  function acreditar() {
    const credito = acreditarOficios(oficios(), ctx.progreso());
    const ids = Object.keys(credito);
    if (ids.length) {
      const r = rangoGeneral(oficios());
      setTimeout(() => ctx.nota('Tus oficios', r.nivel ? `Con lo que ya hiciste en el valle, sos ${r.titulo.toLowerCase()}. Miralo en el cuaderno (J)` : 'Lo que ya hiciste cuenta: miralo en el cuaderno (J)', true), 4000);
    }
    return credito;
  }

  // Lo remado en el kayak o navegado en el velero, en metros de verdad.
  function remar(js) {
    if (!js || !(js.enKayak || js.enVela)) { ultimo = null; return; }
    if (!ultimo) { ultimo = { x: js.pos.x, z: js.pos.z }; return; }
    const d = Math.hypot(js.pos.x - ultimo.x, js.pos.z - ultimo.z);
    ultimo.x = js.pos.x; ultimo.z = js.pos.z;
    if (!(d > 0.01) || d > 6) return;   // un salto grande es un cambio de lugar, no remo
    const of = oficios();
    of.metros = (of.metros || 0) + d;
    while (of.metros >= METROS_REMO) { of.metros -= METROS_REMO; ganar('navegante', XP.remo); }
  }

  // ---------------------------------------------------------------- el cuaderno
  function dibujarCuaderno(lista, ficha, el, pueblo = null) {
    const of = oficios();
    const r = rangoGeneral(of);
    lista.appendChild(el('p', 'progreso', `Tu rango: ${r.titulo}`));
    const ul = el('ul', 'lista');
    const ids = [...ORDEN_OFICIOS, ...(pueblo ? ['pueblo'] : [])];
    if (!ids.includes(elegido)) elegido = r.id || ORDEN_OFICIOS[0];
    for (const id of ids) {
      const b = el('button');
      if (id === 'pueblo') {
        const pb = ctx.progreso().pueblo;
        b.appendChild(el('span', pb?.pobladores?.length ? '' : 'pendiente', pb?.nombre || 'Tu pueblo'));
        if (pb?.pobladores?.length) b.appendChild(el('span', 'marca', `${pb.pobladores.length} ${pb.pobladores.length === 1 ? 'vecino' : 'vecinos'}`));
      } else {
        const e = estadoOficio(of, id);
        b.appendChild(el('span', e.nivel ? '' : 'pendiente', e.nivel ? e.titulo : OFICIOS[id].nombre));
        b.appendChild(el('span', 'marca', e.nivel ? `nivel ${e.nivel}` : 'sin nivel'));
      }
      b.dataset.oficio = id;
      if (elegido === id) b.setAttribute('aria-current', 'true');
      b.addEventListener('click', () => { elegido = id; ctx.redibujar?.(); });
      const li = el('li'); li.appendChild(b); ul.appendChild(li);
    }
    lista.appendChild(ul);

    if (elegido === 'pueblo' && pueblo) { pueblo.dibujarCuaderno(ficha, el); return; }
    const e = estadoOficio(of, elegido);
    ficha.appendChild(el('h2', '', e.nivel ? e.titulo : e.nombre));
    ficha.appendChild(el('p', 'anotado', `${e.nombre} · nivel ${e.nivel} de 5 · ${e.xp} de experiencia`));
    ficha.appendChild(el('p', 'texto', `Se aprende: ${e.de.toLowerCase()}.`));
    const barra = el('div', 'barra-oficio');
    barra.style.cssText = 'height:8px;border-radius:4px;background:rgba(120,100,70,0.25);margin:6px 0 10px;overflow:hidden';
    const lleno = el('div');
    lleno.style.cssText = `height:100%;width:${Math.round(e.avance * 100)}%;background:#8a6b4a`;
    barra.appendChild(lleno);
    ficha.appendChild(barra);
    ficha.appendChild(el('p', 'pista', e.hasta === null ? 'Llegaste a lo más alto del oficio.' : `Faltan ${e.falta} para el nivel ${e.nivel + 1}.`));
    const hab = el('ul', 'habilidades');
    for (const h of e.habilidades) {
      const li = el('li', h.tiene ? 'tiene' : 'pendiente', `${h.nivel}. ${h.texto}`);
      if (!h.tiene) li.style.opacity = '0.55';
      hab.appendChild(li);
    }
    ficha.appendChild(hab);
  }

  return { oficios, nivel, ganar, acreditar, remar, dibujarCuaderno, elegir: (id) => { elegido = id; } };
}
