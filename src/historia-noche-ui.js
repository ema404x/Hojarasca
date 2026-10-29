// 4.13.0 (agente B): la noche de la Historia, en pantalla: la tarjeta que la anuncia, el panel de la noche
// (tiempo, vida, puerta o travesuras, duendes, flechas), la tarjeta de cuando sale mal y los dos finales
// (el del trato y el de la pelea). Las reglas están en `historia-noche.js`; lo que se ve del mundo, en
// `historia-noche-mundo.js`. Sin THREE: lo que toca el juego llega por `ctx` y por `mundo`.
//
// Cómo encaja en la historia: el capítulo 8 («La noche del temporal») termina como siempre (fase 'outro'),
// pero en vez de cerrarse ahí, ofrece la noche. Ganarla cierra el capítulo con el final que corresponde
// (el premio y `terminada` salen de `cerrarCapitulo`, como antes). Perderla no cuesta nada: vuelve el reloj
// a su hora, el refugio sigue como estaba y se puede intentar de nuevo todas las veces que se quiera.
import { capituloActual } from './historia.js';
import { modoDeNoche, empezarIntento, cerrarIntento, dejarPerdida, sanearNoche, relojNoche } from './historia-noche.js';

export const CSS_NOCHE = `
.noche-hud { position: absolute; left: 28px; top: 92px; width: min(300px, 46vw); padding: 10px 14px 10px; border-radius: 10px; background: rgba(16,20,18,.62); color: #f2e6c8; font-family: 'Spectral', Georgia, serif; pointer-events: none; }
.noche-hud.oculto { display: none; }
.noche-hud b { display: flex; justify-content: space-between; align-items: baseline; font-family: 'Caveat', cursive; font-size: 24px; font-weight: 700; margin-bottom: 4px; }
.noche-hud b small { font-family: 'Spectral', Georgia, serif; font-size: 18px; font-weight: 600; letter-spacing: .04em; }
.noche-hud .nh-fila { display: grid; grid-template-columns: 74px 1fr; gap: 8px; align-items: center; margin: 4px 0; font-size: 13px; }
.noche-hud .nh-barra { height: 8px; border-radius: 4px; background: rgba(239,230,210,.16); overflow: hidden; }
.noche-hud .nh-barra i { display: block; height: 100%; background: #a9c46a; }
.noche-hud .nh-barra i.puerta { background: #c99a52; }
.noche-hud .nh-barra i.tension { background: #e8d9a0; }
.noche-hud p { margin: 4px 0 0; font-size: 12.5px; opacity: .78; }
.noche-hud p.nh-ayuda { opacity: .6; font-size: 12px; }
.noche-hud .nh-arma { color: #e8d9a0; font-weight: 600; }
.noche-flash { position: fixed; inset: 0; pointer-events: none; z-index: 8; opacity: 0; background: radial-gradient(ellipse at center, rgba(120,0,0,0) 45%, rgba(150,20,10,.55) 100%); }
`;

// ---------------------------------------------------------------- los textos (cortos, sin nada explícito)
export const TEXTOS_NOCHE = {
  // la ayuda de la pantalla al empezar (el guion de la espera lo escribe B: acá sólo van las instrucciones)
  ayuda: ['Mouse: apuntar. Clic: tirar; con el arco, mantené para tensar más', '1 y 2, o la rueda: cambiar entre el arco y la honda (la honda no se queda sin piedras)', 'Aguantá hasta que pare la nevada: unos cuatro minutos y medio'],
  // si se pierde: nadie se lastima, nunca hay sangre
  perdida: {
    pelea: { vida: ['Te quedaste sin aire, sentado en la nieve. El galpón cruje.', 'Nadie se lastimó. El reloj vuelve a las 22:00 si querés otra vuelta; si no, que amanezca.'], puerta: ['Te quedaste sin aire, sentado en la nieve. El galpón cruje, y cede.', 'Nadie se lastimó. El reloj vuelve a las 22:00 si querés otra vuelta; si no, que amanezca.'] },
    trato: { travesuras: ['Se rieron tanto de vos que se cayeron de espaldas en la nieve. El galpón cruje de tanta risa.', 'No hay rencor: era una prueba. El reloj vuelve a las 22:00 si querés otra vuelta; si no, que amanezca.'] },
  },
};

export function crearNocheUi(ctx, tarjetas, util) {
  const doc = ctx.documento || document;
  const $ = (id) => doc.getElementById(id);
  const mundo = ctx.noche;   // historia-noche-mundo.js (puede faltar en una prueba sin mundo)
  const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let espera = 0;          // segundos (de juego) hasta volver a ofrecer la noche, si dijiste «todavía no»
  let outroVisto = false;  // la tarjeta larga (el temporal y lo que viene) sale una sola vez por sesión
  let acum = 0, htmlHud = '';

  // ---- el panel de la noche
  const hud = doc.createElement('div');
  hud.id = 'historia-noche-hud';
  hud.className = 'noche-hud oculto';
  hud.setAttribute('aria-live', 'off');
  ($('hud') || doc.body).appendChild(hud);
  const flash = doc.createElement('div');
  flash.className = 'noche-flash';
  doc.body.appendChild(flash);

  const activa = () => !!mundo?.activa();
  // 4.17.0: las escenas que rodean la noche (entre olas, al ganar, al perder: las de B). Si la escena no está escrita, se sigue de largo.
  let escenaDeNoche = null;   // { id, alFin }
  function lanzarEscena(id, alFin) {
    const dir = ctx.escenas?.();
    if (!dir || dir.activa() || typeof dir.hay !== 'function' || !dir.hay(id)) { alFin?.(); return false; }
    mundo?.pausar?.(true);
    let ok = false;
    try { ok = dir.disparar(id) === true; } catch { ok = false; }
    if (!ok) { mundo?.pausar?.(false); alFin?.(); return false; }
    escenaDeNoche = { id, alFin, visto: false };
    return true;
  }
  function seguirEscena() {
    if (!escenaDeNoche) return;
    const dir = ctx.escenas?.();
    if (dir && dir.activa()) { escenaDeNoche.visto = true; return; }
    const { alFin } = escenaDeNoche;
    escenaDeNoche = null;
    mundo?.pausar?.(false);
    try { alFin?.(); } catch (e) { console.error('noche: escena', e); }
  }
  // 4.17.0: la noche empieza sola al terminar la escena de la espera (capítulo 12, 22:00 en el galpón) y se repite hasta ganar o dejar que amanezca
  const interviene = (h) => h.activa && h.fase === 'jugando' && capituloActual(h).id === 'nevada' && !!h.escenas?.vistas?.['noche-espera'] && h.duendes?.noche === 'pendiente';

  function dibujarHud(d) {
    hud.classList.toggle('oculto', !d);
    if (!d) { flash.style.opacity = '0'; return; }
    flash.style.opacity = String(Math.min(1, d.herido));
    const pelea = d.modo === 'pelea';
    const arma = d.arma === 'arco' ? 'Arco' : 'Honda';
    let html = `<b>La noche${d.ola ? ` · ola ${d.ola} de 3` : ''}<small>${esc(relojNoche(d.restante))}</small></b>`;
    if (pelea) {
      html += `<div class="nh-fila"><span>Aire</span><div class="nh-barra"><i style="width:${Math.round(d.vida * 100)}%"></i></div></div>`;
      html += `<div class="nh-fila"><span>Galpón</span><div class="nh-barra"><i class="puerta" style="width:${Math.round(d.puerta * 100)}%"></i></div></div>`;
    } else {
      html += `<div class="nh-fila"><span>Travesuras</span><div class="nh-barra"><i class="puerta" style="width:${Math.round((d.travesuras / d.travesurasMax) * 100)}%"></i></div></div>`;
    }
    if (d.jefe) html += `<div class="nh-fila"><span>Mandamás</span><div class="nh-barra"><i class="puerta" style="width:${Math.round(d.jefe.vida * 100)}%"></i></div></div>`;
    html += `<p>Duendes: ${d.duendes} · Flechas: ${d.flechas} · En la mano: <span class="nh-arma">${arma}</span></p>`;
    html += `<p class="nh-ayuda">Clic: tirar · 1 y 2: arco y honda</p>`;
    if (html !== htmlHud) { htmlHud = html; hud.innerHTML = html; ctx.traducir?.(hud); }
  }

  // ---- empezar un intento
  function empezar() {
    const h = util.historia();
    if (activa() || !interviene(h)) return false;
    const modo = modoDeNoche(h);
    const horas = ctx.progreso().horas;
    empezarIntento(h, horas < 22 || horas > 23.8 ? 22 : horas);
    ctx.guardar();
    htmlHud = '';
    const ok = mundo.iniciar({ modo, alTerminar: alTerminar, alOlaLimpia: (ola) => { if (ola === 1 || ola === 2) lanzarEscena(`noche-entre-${ola}`); }, ...(ctx.nocheContexto ? ctx.nocheContexto(h, modo) : {}) });
    if (!ok) return false;
    ctx.nota('Empieza la noche de la nevada', TEXTOS_NOCHE.ayuda[0], true);
    return true;
  }

  // ---- empieza sola (la escena de la espera ya la anunció); si estás en un vehículo o con una tarjeta abierta, espera
  function ofrecer() {
    const h = util.historia();
    if (!interviene(h) || activa() || espera > 0) return false;
    try { mundo?.preparar(); } catch (e) { console.warn('noche: preparar', e && e.message); }   // (armar y compilar bajo la escena, no a mitad de la noche)
    return empezar();
  }

  // ---- cuando termina (ganó, perdió o se abandonó)
  function alTerminar(res) {
    const h = util.historia();
    const antes = sanearNoche(h.noche).horasAntes;
    if (res.motivo === 'abandono') {
      // se dejó a medias (la historia en pausa, el juego cerrado): vuelve el reloj y nada más
      if (antes !== null) ctx.progreso().horas = antes;
      h.noche = sanearNoche(h.noche); h.noche.horasAntes = null;
      ctx.guardar();
      return;
    }
    const horas = cerrarIntento(h, res.gano);
    htmlHud = ''; dibujarHud(null);
    if (res.gano) { ctx.guardar(); lanzarEscena('noche-tras-ganar', () => { amanecer(h); ctx.guardar(); }); }
    else {
      if (horas !== null) ctx.progreso().horas = horas;
      ctx.guardar();
      // la escena de B ofrece «Otra vez» (noche:reintentar) o «Que amanezca» (noche:perdida); sin escena, la tarjeta de siempre
      const dir = ctx.escenas?.();
      if (dir && typeof dir.hay === 'function' && dir.hay('noche-tras-perder')) lanzarEscena('noche-tras-perder', () => { if (h.duendes?.noche === 'perdida') { amanecer(h); ctx.guardar(); } else { espera = 0; empezar(); } });
      else mostrarPerdida(res);
    }
  }
  // la noche pasó: son las 6:24 del otro día (y la nevada para)
  function amanecer(h) {
    const p = ctx.progreso();
    if (p.horas >= 12) { p.dia = (p.dia || 1) + 1; ctx.nota(`Día ${p.dia}`, 'Pasó la noche'); }
    p.horas = 6.4;
    h.noche = sanearNoche(h.noche); h.noche.horasAntes = null;
    ctx.jugadorAlGalpon?.();
  }
  function mostrarPerdida(res) {
    const grupo = TEXTOS_NOCHE.perdida[res.modo] || TEXTOS_NOCHE.perdida.trato;
    const texto = grupo[res.motivo] || Object.values(grupo)[0];
    tarjetas.mostrar({
      clase: 'despues', arriba: 'La historia del valle · la noche de la nevada', titulo: 'La noche se te escapó', texto,
      opciones: [
        { id: 'otra', texto: 'Otra vez', detalle: 'Vuelve a las 22:00, todo como estaba. Sin castigo, las veces que haga falta' },
        { id: 'amanezca', texto: 'Que amanezca', detalle: 'La noche queda perdida y la historia sigue: el valle sabe perder' },
      ],
      alElegir: (id) => {
        tarjetas.cerrar();
        const h = util.historia();
        if (id === 'otra') { espera = 0; empezar(); }
        else { dejarPerdida(h); amanecer(h); ctx.guardar(); }
        return true;
      },
    });
  }

  // ---- cada cuadro
  function actualizar(dt) {
    const h = util.historia();
    if (escenaDeNoche) seguirEscena();
    if (activa()) {
      // la historia se puso en pausa a mitad de la noche: se deja
      if (!h.activa) { mundo.abandonar(); return; }
      mundo.actualizar(dt);
      acum += dt;
      if (acum >= 0.1) { acum = 0; dibujarHud(mundo.hud()); }
      return;
    }
    if (hud && !hud.classList.contains('oculto')) dibujarHud(null);
    if (espera > 0 && ctx.modo() === 'jugando') espera = Math.max(0, espera - dt);
    // se cerró el juego en plena noche: el reloj vuelve a la hora de antes
    const n = h.noche;
    if (n && n.horasAntes !== null && n.horasAntes !== undefined) {
      ctx.progreso().horas = n.horasAntes; n.horasAntes = null; ctx.guardar();
    }
  }

  // 4.17.0: los blancos de práctica del capítulo 11 (los maneja el mundo de la noche: historia-noche-mundo.js)
  const practicar = (dt, donde) => (mundo?.practicar ? mundo.practicar(dt, donde) : 0);
  return { practicar, actualizar, ofrecer, empezar, interviene, activa, hud, dibujarHud, mostrarPerdida, amanecer, esperar: (s) => { espera = s; }, get espera() { return espera; } };
}
