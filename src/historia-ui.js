// 3.1: la historia guiada y los eventos del valle, en pantalla. Arma las tarjetas (la de
// entrada y la de salida de cada capítulo, la de decidir un evento y la de "lo que pasó
// después"), el panel de objetivos del HUD, el botón de la historia en la pausa y en la
// guía, y la opción Libre / Historia de la portada. Con una tarjeta abierta el juego queda
// quieto (como con la pausa) hasta que elegís.
//
// Sin THREE: lo que toca el mundo llega por `ctx` desde main.js. Las reglas están en
// `historia.js` y `eventos-valle.js` (puros, se prueban en Node).

import { CAPITULOS, sanearHistoria, estadoHistoria, empezarHistoria, pausarHistoria, arrancarCapitulo, revisarHistoria, cerrarCapitulo, momentoPendiente, momentoLanzado, anotarCharla, panelHistoria, resumenHistoria, capituloActual, numeroCapitulo } from './historia.js';
import { resumenEventos } from './eventos-valle.js';
import { crearEventosValleUi } from './eventos-valle-ui.js';

export const CSS_VALLE = `
.valle-velo { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(10,14,12,.42); z-index: 40; padding: 16px; }
.valle-velo.oculto { display: none; }
.valle-carta { max-width: 560px; width: 100%; max-height: calc(100vh - 32px); overflow: auto; background: var(--papel, #efe6d2); color: var(--tinta-papel, #3a2f1e); padding: 22px 26px 18px; border-radius: 4px; box-shadow: 0 18px 50px rgba(0,0,0,.45); font-family: 'Spectral', Georgia, serif; }
.valle-carta small.arriba { display: block; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; color: #8b7757; margin-bottom: 2px; }
.valle-carta h2 { font-family: 'Caveat', cursive; font-size: 34px; font-weight: 700; margin: 0 0 8px; line-height: 1.05; }
.valle-carta p { font-size: 16px; line-height: 1.5; margin: 0 0 10px; }
.valle-carta ul { margin: 4px 0 12px; padding-left: 20px; font-size: 15px; }
.valle-carta .premio { font-size: 15px; border-left: 3px solid var(--notro, #b8432f); padding-left: 10px; color: #6b5838; }
.valle-carta.evento { border-top: 5px solid #8a9b5e; }
.valle-carta.despues { border-top: 5px solid #8b7757; }
.valle-carta.capitulo { border-top: 5px solid var(--notro, #b8432f); }
.valle-opciones { display: grid; gap: 8px; margin-top: 14px; }
.valle-opciones button { display: grid; grid-template-columns: auto 1fr; gap: 2px 10px; align-items: baseline; text-align: left; padding: 9px 12px; border-radius: 8px; background: rgba(58,47,30,.08); color: inherit; font: inherit; cursor: pointer; border: 1px solid rgba(58,47,30,.18); }
.valle-opciones button:hover:not([disabled]), .valle-opciones button:focus-visible { background: rgba(58,47,30,.16); }
.valle-opciones button[disabled] { opacity: .55; cursor: default; }
.valle-opciones kbd { grid-row: span 2; font-size: 12px; padding: 1px 6px; border-radius: 4px; background: rgba(58,47,30,.14); }
.valle-opciones b { font-weight: 600; font-size: 16px; }
.valle-opciones small { grid-column: 2; font-size: 13px; color: #6b5838; }
.historia-hud b small { display: block; font-family: 'Spectral', Georgia, serif; font-size: 12px; font-weight: 400; opacity: .7; }
.valle-guia { margin: 0 0 16px; padding: 10px 14px; border-radius: 10px; background: rgba(255,255,255,.05); }
.valle-guia h3 { margin: 0 0 4px; font-size: 18px; }
.valle-guia p { margin: 4px 0; font-size: 14px; opacity: .85; }
.valle-guia button { margin: 6px 8px 0 0; padding: 5px 12px; font-size: 13px; }
`;

// ---------------------------------------------------------------- las tarjetas
function crearTarjetas(doc, ctx) {
  let actual = null;
  const velo = doc.createElement('div');
  velo.id = 'valle-tarjeta';
  velo.className = 'valle-velo oculto';
  velo.setAttribute('role', 'dialog');
  velo.setAttribute('aria-modal', 'true');
  doc.body.appendChild(velo);
  const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function dibujar(def) {
    const partes = [`<div class="valle-carta ${esc(def.clase || '')}">`];
    if (def.arriba) partes.push(`<small class="arriba">${esc(def.arriba)}</small>`);
    partes.push(`<h2>${esc(def.titulo)}</h2>`);
    for (const t of def.texto || []) partes.push(`<p>${esc(t)}</p>`);
    if (def.lista?.length) partes.push(`<ul>${def.lista.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`);
    if (def.premio) partes.push(`<p class="premio">${esc(def.premio)}</p>`);
    partes.push('<div class="valle-opciones">');
    def.opciones.forEach((o, i) => {
      partes.push(`<button data-valle-opcion="${esc(o.id)}"${o.deshabilitada ? ' disabled' : ''}><kbd>${i + 1}</kbd><b>${esc(o.texto)}</b>${o.detalle ? `<small>${esc(o.detalle)}</small>` : ''}</button>`);
    });
    partes.push('</div></div>');
    velo.innerHTML = partes.join('');
    ctx.traducir?.(velo);
    const primero = velo.querySelector('button:not([disabled])');
    try { primero?.focus({ preventScroll: true }); } catch {}
  }
  function mostrar(def) {
    const yaAbierta = !!actual;
    actual = def;
    dibujar(def);
    velo.classList.remove('oculto');
    if (!yaAbierta) ctx.pausar();
  }
  function cerrar() {
    if (!actual) return;
    actual = null;
    velo.classList.add('oculto');
    velo.innerHTML = '';
    ctx.reanudar();
  }
  function elegir(id) {
    if (!actual) return false;
    const o = actual.opciones.find((x) => x.id === id);
    if (!o || o.deshabilitada) return false;
    return actual.alElegir(id) !== false;
  }
  velo.addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-valle-opcion]');
    if (b && !b.disabled) elegir(b.dataset.valleOpcion);
  });
  // con una tarjeta abierta, el teclado es de la tarjeta: 1 a 3 eligen; Enter la opción
  // enfocada; Escape sólo cierra las que tienen un único botón (las otras piden decidir)
  doc.addEventListener('keydown', (ev) => {
    if (!actual) return;
    if (ev.code === 'F11' || ev.code === 'F12') return;
    ev.stopImmediatePropagation();
    if (ev.repeat) return;
    const n = /^(?:Digit|Numpad)([1-9])$/.exec(ev.code);
    if (n) { ev.preventDefault(); const o = actual.opciones[Number(n[1]) - 1]; if (o) elegir(o.id); return; }
    if (ev.code === 'Escape' && actual.opciones.length === 1) { ev.preventDefault(); elegir(actual.opciones[0].id); return; }
    if (ev.code === 'Enter' || ev.code === 'NumpadEnter' || ev.code === 'Space') {
      ev.preventDefault();
      const foco = doc.activeElement?.closest?.('button[data-valle-opcion]');
      if (foco && velo.contains(foco)) elegir(foco.dataset.valleOpcion);
      else if (actual.opciones.length === 1) elegir(actual.opciones[0].id);
    }
  }, true);
  return { mostrar, cerrar, elegir, abierta: () => !!actual, actual: () => actual, velo };
}

// ---------------------------------------------------------------- todo junto
export function crearValleUi(ctx) {
  const doc = ctx.documento || document;
  const $ = (id) => doc.getElementById(id);
  {
    const estilo = doc.createElement('style');
    estilo.textContent = CSS_VALLE;
    doc.head.appendChild(estilo);
  }
  const tarjetas = crearTarjetas(doc, ctx);
  const eventos = crearEventosValleUi(ctx, tarjetas);

  let saneada = null;
  function historia() {
    const p = ctx.progreso();
    if (saneada !== p || !p.historia) { p.historia = sanearHistoria(p.historia); saneada = p; }
    return p.historia;
  }
  const estado = () => estadoHistoria(ctx.progreso(), ctx.extra());

  // la portada muestra la de esta partida: si ya se jugó, lo que tiene su historia
  if (!ctx.esDesafio && ctx.progreso().pos) ctx.ajustes().relaxTipo = historia().activa ? 'historia' : 'libre';

  // ---------------------------------------------------------------- el panel del HUD
  const panel = doc.createElement('div');
  panel.id = 'historia-hud';
  panel.className = 'tutorial historia-hud oculto';
  panel.setAttribute('aria-live', 'polite');
  ($('hud') || doc.body).appendChild(panel);
  let htmlPanel = '';
  const escP = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function dibujarPanel(h, s) {
    const datos = !ctx.esDesafio && ctx.modo() === 'jugando' ? panelHistoria(h, s) : null;
    panel.classList.toggle('oculto', !datos);
    if (!datos) return;
    const html = `<b>${escP(datos.titulo)}<small>La historia del valle</small></b>`
      + datos.objetivos.map((o) => `<p class="${o.hecho ? 'hecho' : ''}"><kbd>${o.hecho ? '✓' : escP(ctx.teclaVisible ? ctx.teclaVisible(o.tecla) : o.tecla)}</kbd>${escP(o.texto)}</p>`).join('');
    if (html !== htmlPanel) { htmlPanel = html; panel.innerHTML = html; ctx.traducir?.(panel); }
    // debajo de la guía del primer día, si está a la vista
    const tut = $('tutorial');
    const arriba = tut && !tut.classList.contains('oculto') ? tut.offsetTop + tut.offsetHeight + 10 : 92;
    if (panel.style.top !== `${arriba}px`) panel.style.top = `${arriba}px`;
  }

  // ---------------------------------------------------------------- las tarjetas de la historia
  function mostrarIntro() {
    const h = historia();
    const c = capituloActual(h);
    tarjetas.mostrar({
      clase: 'capitulo', arriba: `La historia del valle · capítulo ${numeroCapitulo(h)} de ${CAPITULOS.length}`,
      titulo: c.titulo, texto: c.intro, lista: c.objetivos.map((o) => o.texto),
      opciones: [{ id: 'empezar', texto: 'Empezar el capítulo', detalle: 'Los objetivos quedan arriba, a la izquierda. Nada más cambia: el valle sigue libre.' }],
      alElegir: () => {
        arrancarCapitulo(h, estado());
        tiempoCapitulo = 0;
        ctx.diario('capitulo', `empecé «${c.titulo}»`);
        ctx.guardar();
        tarjetas.cerrar();
        return true;
      },
    });
  }
  function mostrarOutro() {
    const h = historia();
    const c = capituloActual(h);
    const ultimo = h.capitulo >= CAPITULOS.length - 1;
    tarjetas.mostrar({
      clase: 'capitulo', arriba: `Capítulo ${numeroCapitulo(h)} · terminado`,
      titulo: c.titulo, texto: c.outro, premio: c.premio?.texto ? `Te queda: ${c.premio.texto}` : '',
      opciones: [{ id: 'seguir', texto: ultimo ? 'Seguir en el valle' : 'Seguir', detalle: ultimo ? 'La historia termina; el juego no' : `Sigue: «${CAPITULOS[h.capitulo + 1].titulo}»` }],
      alElegir: () => {
        const r = cerrarCapitulo(h, ctx.progreso().dia);
        if (r?.premio) ctx.cobrar(r.premio);
        ctx.diario('capitulo', `terminé «${c.titulo}»`);
        ctx.sonido?.()?.anotar?.();
        ctx.guardar();
        if (r && !r.fin) mostrarIntro();
        else {
          tarjetas.cerrar();
          ctx.nota('Terminaste la historia del valle', 'Todo sigue abierto: andá a tu ritmo', true);
        }
        return true;
      },
    });
  }

  // ---------------------------------------------------------------- cada medio segundo
  let acum = 0, esperaInicio = 0, tiempoCapitulo = 0, azarEnPruebas = false;
  const MOMENTO_PRONTO = 90;   // segundos jugando el capítulo antes de su momento "pronto"
  function actualizar(dt) {
    if (ctx.esDesafio) return;
    if (ctx.modo() === 'jugando') { esperaInicio = Math.max(0, esperaInicio - dt); tiempoCapitulo += dt; }
    acum += dt;
    if (acum < 0.5) return;
    acum = 0;
    revisarAhora();
  }
  function revisarAhora() {
    const h = historia();
    const jugando = ctx.modo() === 'jugando';
    const s = h.activa ? estado() : null;
    if (jugando && h.activa) {
      const r = revisarHistoria(h, s);
      for (const o of r.nuevos) { ctx.nota(`✓ ${o.texto}`, `${capituloActual(h).titulo} · la historia del valle`); ctx.sonido?.()?.anotar?.(); }
      if (r.nuevos.length) ctx.guardar();
    }
    dibujarPanel(h, s);
    if (!jugando || tarjetas.abierta() || esperaInicio > 0 || !ctx.libre()) return false;
    if (h.activa && h.fase === 'intro') { mostrarIntro(); return true; }
    if (h.activa && h.fase === 'outro') { mostrarOutro(); return true; }
    if (ctx.enVehiculo()) return false;
    // el momento del capítulo va antes que el azar
    if (h.activa) {
      const m = momentoPendiente(h, s);
      const def = capituloActual(h).momento;
      if (m && (def?.cuando !== 'pronto' || tiempoCapitulo >= MOMENTO_PRONTO)) { if (eventos.forzar(m)) momentoLanzado(h); }   // con otro abierto, se reintenta después
      // lanzado pero perdido (una partida retocada): se vuelve a pedir, para que el capítulo nunca se trabe
      // (3.8.3: «pasó» es su objetivo tildado: un temporal al azar de antes del capítulo no cuenta)
      else if (!m && def && h.momentos[capituloActual(h).id] === 'lanzado' && !capituloActual(h).objetivos.some((o) => o.delMomento && h.hechos[`${capituloActual(h).id}:${o.id}`] !== undefined) && !eventos.ev().activo && !(s.vecinos === false)) eventos.forzar(def.evento);
    }
    return eventos.revisar({ puedeAzar: azarEnPruebas || !ctx.sinAzar?.() });
  }

  // ---------------------------------------------------------------- empezar, pausar, retomar
  function empezar() {
    const h = historia();
    const nueva = empezarHistoria(h, ctx.progreso().dia);
    if (h.fase === 'fin') { ctx.nota('La historia ya terminó', 'Podés releerla en tu diario'); return false; }
    ctx.ajustes().relaxTipo = 'historia';
    ctx.guardarAjustes();
    esperaInicio = 1.2;
    ctx.guardar();
    ctx.nota(nueva ? 'Empieza la historia del valle' : 'Seguís la historia del valle', `Capítulo ${numeroCapitulo(h)}: ${capituloActual(h).titulo}`, true);
    refrescarBotones();
    return true;
  }
  function pausar() {
    const h = historia();
    pausarHistoria(h);
    ctx.ajustes().relaxTipo = 'libre';
    ctx.guardarAjustes();
    ctx.guardar();
    ctx.nota('La historia queda en pausa', 'Se retoma cuando quieras desde la guía o la pausa');
    refrescarBotones();
  }
  // al entrar desde la portada: Historia la empieza (o la retoma); Libre la deja en pausa
  function alEntrar() {
    if (ctx.esDesafio) return;
    const h = historia();
    const quiere = ctx.ajustes().relaxTipo === 'historia';
    if (quiere && !h.activa && h.fase !== 'fin') {
      empezarHistoria(h, ctx.progreso().dia);
      esperaInicio = 2.5;
      ctx.guardar();
    } else if (!quiere && h.activa) { pausarHistoria(h); ctx.guardar(); }
    else if (quiere) esperaInicio = 2.5;
  }

  // ---------------------------------------------------------------- portada, pausa y guía
  function portada(ajustes) {
    const caja = $('opcion-relax');
    if (!caja) return;
    caja.classList.toggle('oculto', ajustes.modo !== 'relax');
    const t = $('relax-tipo-texto');
    if (t) t.textContent = ajustes.relaxTipo === 'historia'
      ? `Ocho capítulos cortos, con un rumbo: llegar, arreglar el refugio, conocer a los vecinos… Nada se traba: el valle sigue libre.`
      : 'Sin capítulos: el valle entero, a tu ritmo. La historia se puede empezar cuando quieras desde la guía o la pausa.';
  }
  let botonPausa = null, cajaGuia = null;
  function textoBoton(h) {
    if (h.fase === 'fin') return null;
    if (!h.empezada) return { accion: 'empezar', texto: 'Empezar la historia del valle' };
    return h.activa ? { accion: 'pausar', texto: 'Dejar la historia en pausa' } : { accion: 'empezar', texto: 'Retomar la historia del valle' };
  }
  function refrescarBotones() {
    if (ctx.esDesafio) return;
    const h = historia();
    const b = textoBoton(h);
    if (botonPausa) {
      botonPausa.classList.toggle('oculto', !b);
      if (b) { botonPausa.textContent = b.texto; botonPausa.dataset.accion = b.accion; }
    }
    if (cajaGuia) {
      cajaGuia.innerHTML = `<h3>La historia del valle</h3><p>${escP(resumenHistoria(h))}</p>`
        + (b ? `<button data-historia="${b.accion}">${escP(b.texto)}</button>` : '')
        + `<p>${escP(resumenEventos(eventos.ev()))}.</p>`;
      ctx.traducir?.(cajaGuia);
    }
  }
  function accion(a) { if (a === 'pausar') pausar(); else empezar(); }
  if (!ctx.esDesafio) {
    const menu = doc.querySelector('#pausa .menu');
    const ref = $('btn-cuaderno');
    if (menu) {
      botonPausa = doc.createElement('button');
      botonPausa.id = 'btn-historia';
      botonPausa.addEventListener('click', () => accion(botonPausa.dataset.accion));
      if (ref && ref.parentNode === menu) ref.after(botonPausa); else menu.appendChild(botonPausa);
    }
    const guia = $('guia-contenido');
    if (guia) {
      cajaGuia = doc.createElement('div');
      cajaGuia.id = 'historia-guia';
      cajaGuia.className = 'valle-guia';
      cajaGuia.addEventListener('click', (ev) => { const b = ev.target.closest('button[data-historia]'); if (b) accion(b.dataset.historia); });
      guia.before(cajaGuia);
    }
    // se refrescan al abrirse la pausa o la guía
    const mirar = (id) => { const el = $(id); if (el && typeof MutationObserver === 'function') new MutationObserver(() => { if (!el.classList.contains('oculto')) refrescarBotones(); }).observe(el, { attributes: true, attributeFilter: ['class'] }); };
    mirar('pausa'); mirar('guia');
    refrescarBotones();
  }

  // 3.1: hablaste con un vecino (lo anota siempre: sirve si la historia empieza después)
  function hablo(clave) {
    if (ctx.esDesafio) return;
    if (anotarCharla(historia(), clave)) ctx.guardar();
  }

  return {
    actualizar, alEntrar, portada, hablo, empezar, pausar, historia, estado, eventos, tarjetas,
    abierta: () => tarjetas.abierta(),
    azar: (v) => { azarEnPruebas = !!v; return azarEnPruebas; },
    // para las pruebas: revisar ya, sin esperar el medio segundo ni el rato del capítulo
    revisarAhora: () => { if (ctx.esDesafio) return false; esperaInicio = 0; tiempoCapitulo = Math.max(tiempoCapitulo, MOMENTO_PRONTO); return revisarAhora(); },
  };
}
