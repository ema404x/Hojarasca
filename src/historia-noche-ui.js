// 4.13.0 (agente B): la noche de la Historia, en pantalla: la tarjeta que la anuncia, el panel de la noche
// (tiempo, vida, puerta o travesuras, duendes, flechas), la tarjeta de cuando sale mal y los dos finales
// (el del trato y el de la pelea). Las reglas están en `historia-noche.js`; lo que se ve del mundo, en
// `historia-noche-mundo.js`. Sin THREE: lo que toca el juego llega por `ctx` y por `mundo`.
//
// Cómo encaja en la historia: el capítulo 8 («La noche del temporal») termina como siempre (fase 'outro'),
// pero en vez de cerrarse ahí, ofrece la noche. Ganarla cierra el capítulo con el final que corresponde
// (el premio y `terminada` salen de `cerrarCapitulo`, como antes). Perderla no cuesta nada: vuelve el reloj
// a su hora, el refugio sigue como estaba y se puede intentar de nuevo todas las veces que se quiera.
import { CAPITULOS, cerrarCapitulo, capituloActual } from './historia.js';
import { modoDeNoche, arsenalDeNoche, nochePendiente, empezarIntento, cerrarIntento, sanearNoche, relojNoche } from './historia-noche.js';

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
  // Antes de que nadie sepa a qué vienen (el misterio sigue hasta el portón)
  intro: {
    arriba: 'La historia del valle · el final',
    titulo: 'Lo que vino de noche',
    texto: [
      'Al caer el sol, el monte se quedó sin pájaros. Del lado del bosque se encienden luces chicas, una, otra, diez, y se oyen risas finitas que no son de nadie que conozcas.',
      'No sabés si vienen a jugar o a pelear, y capaz que ellos tampoco. Lo vas a saber cuando lleguen al portón. Las estacas están puestas, las antorchas prendidas y el refugio, a tus espaldas.',
    ],
    prestadas: { arco: 'Ramón dejó en el escalón un arco de lenga.', honda: 'Nicanor te dejó su honda de cuero.' },
    lista: ['Mouse: apuntar. Clic: tirar; con el arco, mantené para tensar más', '1 y 2, o la rueda: cambiar entre el arco y la honda (la honda no se queda sin piedras)', 'Aguantá hasta que amanezca: unos tres minutos'],
  },
  // Cuando se vuelve a intentar
  otra: {
    arriba: 'La historia del valle · el final',
    titulo: 'Otra vez la noche',
    texto: ['Las luces chicas vuelven a asomar entre los coihues. El portón sigue en su lugar y el arco, en tu mano.'],
  },
  perdida: {
    pelea: {
      vida: ['Te sacaron del paso entre risas y garrotes, y lo último que viste fue el techo del refugio dando vueltas.', 'Cuando abriste los ojos ya clareaba. Nada se perdió: el reloj vuelve a su hora, el refugio sigue en pie y el portón espera.'],
      puerta: ['La puerta del refugio se vino abajo bajo tantos golpes chiquitos. Los duendes se quedaron un rato mirando el agujero y después se fueron como habían venido.', 'Nada se perdió: el reloj vuelve a su hora, la puerta ya está en su sitio y el portón espera.'],
    },
    trato: {
      travesuras: ['Se rieron tanto de vos que se cayeron de espaldas en el pasto. Alguno dejó un gorrito en la puerta, de recuerdo.', 'No hay rencor: perdiste la prueba, nada más. El reloj vuelve a su hora y se puede intentar cuando quieras.'],
    },
  },
  // Los dos finales
  final: {
    trato: {
      arriba: 'La historia del valle · final',
      titulo: 'El trato',
      texto: [
        'Cuando el cielo empezó a aclarar no quedaba ni uno en pie: todos sentados en el pasto, jadeando de risa, con el gorro torcido. Era una prueba. Lo supiste cuando el más viejo se paró, te miró de abajo con un ojo cerrado y asintió una sola vez.',
        'Dejaron en el escalón una semilla dorada, de las que nadie te dijo el nombre, y se fueron hacia el monte en fila, uno detrás del otro, como los chicos cuando salen de la escuela.',
        'Desde esa noche, algunas mañanas hay huellas chiquitas alrededor del fuego y leña de más que no juntaste. La historia termina acá, pero el valle no: ahora es también de ellos. Tomate tu tiempo.',
      ],
    },
    pelea: {
      arriba: 'La historia del valle · final',
      titulo: 'El valle en silencio',
      texto: [
        'Amaneció con el monte en silencio. Las luces chicas se fueron apagando entre los coihues, una por una, y la última risa se cortó en el aire como un hilo.',
        'Quedaron gorritos tirados en el pasto, una flecha clavada en el escalón y el refugio entero, aunque golpeado. Ramón vino a la mañana, miró todo y no preguntó nada: te alcanzó el mate.',
        'Ganaste la noche y el valle quedó en paz. Pero el monte ya no suena igual: algo falta, y ahora lo sabés. La historia termina acá, pero el valle no. Tomate tu tiempo.',
      ],
    },
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
  const interviene = (h) => h.activa && h.fase === 'outro' && h.capitulo >= CAPITULOS.length - 1 && nochePendiente(h);

  function dibujarHud(d) {
    hud.classList.toggle('oculto', !d);
    if (!d) { flash.style.opacity = '0'; return; }
    flash.style.opacity = String(Math.min(1, d.herido));
    const pelea = d.modo === 'pelea';
    const arma = d.arma === 'arco' ? 'Arco' : 'Honda';
    let html = `<b>La noche<small>${esc(relojNoche(d.restante))}</small></b>`;
    if (pelea) {
      html += `<div class="nh-fila"><span>Vida</span><div class="nh-barra"><i style="width:${Math.round(d.vida * 100)}%"></i></div></div>`;
      html += `<div class="nh-fila"><span>Puerta</span><div class="nh-barra"><i class="puerta" style="width:${Math.round(d.puerta * 100)}%"></i></div></div>`;
    } else {
      html += `<div class="nh-fila"><span>Travesuras</span><div class="nh-barra"><i class="puerta" style="width:${Math.round((d.travesuras / d.travesurasMax) * 100)}%"></i></div></div>`;
    }
    html += `<p>Duendes: ${d.duendes} · Flechas: ${d.flechas} · En la mano: <span class="nh-arma">${arma}</span></p>`;
    html += `<p class="nh-ayuda">Clic: tirar · 1 y 2: arco y honda</p>`;
    if (html !== htmlHud) { htmlHud = html; hud.innerHTML = html; ctx.traducir?.(hud); }
  }

  // ---- empezar un intento
  function empezar() {
    const h = util.historia();
    if (activa() || !interviene(h)) return false;
    const modo = modoDeNoche(h);
    empezarIntento(h, ctx.progreso().horas);
    ctx.guardar();
    htmlHud = '';
    const ok = mundo.iniciar({ modo, alTerminar: alTerminar });
    if (!ok) return false;
    ctx.nota('Cae la noche', 'Aguantá en el portón hasta que amanezca');
    return true;
  }

  // ---- la tarjeta que la anuncia
  function ofrecer() {
    const h = util.historia();
    if (!interviene(h) || activa()) return false;
    if (espera > 0) return false;
    try { mundo?.preparar(); } catch (e) { console.warn('noche: preparar', e && e.message); }   // (armar y compilar bajo la tarjeta, no a mitad de la noche)
    const c = capituloActual(h);
    const larga = !outroVisto && (h.noche?.intentos || 0) === 0;
    const T = larga ? TEXTOS_NOCHE.intro : TEXTOS_NOCHE.otra;
    const texto = [];
    if (larga) for (const t of c.outro) if (!/^La historia termina/.test(t)) texto.push(t);   // el temporal pasó; la historia todavía no
    texto.push(...T.texto);
    const prestadas = arsenalDeNoche(h).prestadas;
    for (const p of prestadas) texto.push(TEXTOS_NOCHE.intro.prestadas[p]);
    tarjetas.mostrar({
      clase: 'capitulo', arriba: `${T.arriba}`, titulo: T.titulo, texto, lista: larga ? TEXTOS_NOCHE.intro.lista : null,
      opciones: [
        { id: 'salir', texto: 'Salir a esperarlos', detalle: 'Dura unos tres minutos. Si sale mal se repite, sin castigo ni pérdidas.' },
        { id: 'despues', texto: 'Todavía no', detalle: 'El valle sigue libre; la noche espera hasta que quieras' },
      ],
      alElegir: (id) => {
        outroVisto = true;
        tarjetas.cerrar();
        if (id === 'salir') empezar(); else espera = 150;
        return true;
      },
    });
    return true;
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
    if (horas !== null) ctx.progreso().horas = horas;
    ctx.guardar();
    htmlHud = ''; dibujarHud(null);
    if (res.gano) mostrarFinal(res.modo); else mostrarPerdida(res);
  }
  function mostrarPerdida(res) {
    const grupo = TEXTOS_NOCHE.perdida[res.modo] || TEXTOS_NOCHE.perdida.trato;
    const texto = grupo[res.motivo] || Object.values(grupo)[0];
    tarjetas.mostrar({
      clase: 'despues', arriba: 'La historia del valle · el final', titulo: 'La noche se te escapó', texto,
      opciones: [
        { id: 'otra', texto: 'Intentarlo de nuevo', detalle: 'Las veces que haga falta' },
        { id: 'despues', texto: 'Dejarlo para después', detalle: 'El valle sigue libre' },
      ],
      alElegir: (id) => {
        tarjetas.cerrar();
        if (id === 'otra') ofrecerSinTarjeta(); else espera = 120;
        return true;
      },
    });
  }
  function ofrecerSinTarjeta() { espera = 0; empezar(); }

  function mostrarFinal(modo) {
    const h = util.historia();
    const F = TEXTOS_NOCHE.final[modo] || TEXTOS_NOCHE.final.trato;
    const c = capituloActual(h);
    tarjetas.mostrar({
      clase: 'capitulo', arriba: F.arriba, titulo: F.titulo, texto: F.texto, premio: c.premio?.texto ? `Te queda: ${c.premio.texto}` : '',
      opciones: [
        { id: 'seguir', texto: 'Seguir en el valle', detalle: 'La historia termina; el juego no' },
        { id: 'creditos', texto: 'Ver los créditos', detalle: 'Y después, a tu ritmo' },
      ],
      alElegir: (id) => {
        const r = cerrarCapitulo(h, ctx.progreso().dia);
        if (r?.premio) ctx.cobrar(r.premio);
        ctx.diario('capitulo', `terminé «${c.titulo}»`);
        ctx.sonido?.()?.anotar?.();
        ctx.guardar();
        tarjetas.cerrar();
        ctx.nota('Terminaste la historia del valle', 'Todo sigue abierto: andá a tu ritmo', true);
        if (id === 'creditos') ctx.creditos?.();
        return true;
      },
    });
  }

  // ---- cada cuadro
  function actualizar(dt) {
    const h = util.historia();
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

  return { actualizar, ofrecer, empezar, interviene, activa, hud, dibujarHud, mostrarFinal, mostrarPerdida, esperar: (s) => { espera = s; }, get espera() { return espera; } };
}
