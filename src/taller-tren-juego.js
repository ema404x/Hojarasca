// 3.7.3 «La trochita»: el taller ferroviario en el juego (sólo en el Relax). Las reglas son de tren-mejoras.js; el
// galpón lo arma aldea-arquitectura.js (`armarTallerTren`) y lo pone aldea-mundo.js; Martín y Ernesto trabajan ahí
// por su horario (aldea.js). Acá:
//   · E y el aviso (el mismo texto y la misma prioridad: main.js los pone donde van los de la granja): adentro del
//     galpón, lejos de la puerta, E abre el panel de mejoras;
//   · el panel: lo que hay en el taller (lo que pide, lo aportado, lo que falta, las piezas de Anselmo y cuándo queda
//     lista), las mejoras que se pueden pedir, y la pintura, el nombre (con el cuadro de texto de dialogo.js), el
//     silbato y la composición del tren. Anda con los números, el clic (`alClic`: el de las listas del HUD), la
//     ruedita, Enter y el mando (LB/RB, A y B: main.js, con `lista()` como las demás listas del HUD);
//   · el reloj: `avanzarTaller` cada segundo (también lejos o durmiendo: repasa todo lo que pasó); al terminar una
//     mejora, el aviso y `aplicarMejoras(progreso.tren)` del equipo del tren (que lo dibuja: ver main.js, el enganche).
import { trenNuevo, sanearTren, MEJORAS_TREN, IDS_MEJORAS, mejoraDe, puedePedir, pedirMejora, aportarMejora, cancelarPedido, avanzarTaller, tomarAvisos, faltaDelPedido, estadoTaller, pideMejora, textoPide, textoMateriales, textoPiezas, textoListo, textoDias, PARTES_PINTURA, nombreColor, colorTren, NOMBRE_DE_SIEMPRE, pintar, colorSiguiente, ponerNombre, elegirSilbato, silbatosDe, SILBATOS, VAGONES, vagonesHechos, alternarVagon, adelantarVagon, VAGONES_MAX, HIERRO_POR_DIA, LARGO_NOMBRE } from './tren-mejoras.js';
import { EDIFICIOS_ALDEA, PARADA_ALDEA, marcoAldea, localAbierto } from './aldea.js';

const PISO = 0.32;   // el piso del galpón sobre el nivel del lote (PISO_ALDEA)
const W = 8.5, D = 3.6, TABIQUE = 5.4, PUERTA = 3;
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// ¿Dónde está el jugador respecto del taller? (en su marco: x a lo largo, z hacia la vía; null si no está adentro)
export function enElTaller(pos, parada = PARADA_ALDEA) {
  const e = EDIFICIOS_ALDEA['taller-tren'];
  if (!e || !pos || !Number.isFinite(pos.x) || !Number.isFinite(pos.z)) return null;
  const l = marcoAldea(parada).aLocal(pos.x, pos.z);
  const x = l.lx - e.x, z = l.lz - e.z;
  if (x < -W || x > W || z < -D || z > D) return null;
  if (Number.isFinite(pos.y) && (pos.y < e.y + PISO - 1.4 || pos.y > e.y + PISO + 1.6)) return null;
  return { x, z, cuarto: x > TABIQUE };
}
// Donde E abre el panel: en el galpón (no en el cuarto de Martín), y no al lado de la puerta (ahí E abre o cierra)
export function puedeUsarTaller(pos, parada = PARADA_ALDEA) {
  const t = enElTaller(pos, parada);
  if (!t || t.cuarto || t.x > TABIQUE - 0.3) return false;
  return !(Math.abs(t.x - PUERTA) < 1.4 && t.z > 1.8);
}
// El aviso (lo mismo que hace E): según lo que pasa en el taller
export function textoAvisoTaller(tren) {
  const p = tren?.taller?.pedido;
  if (!p) return 'Ver las mejoras del tren';
  const m = mejoraDe(p.id);
  if (estadoTaller(tren) === 'armando') return `Taller: ${m.nombre.toLowerCase()}, lista ${textoListo(p.listo)}`;
  const f = faltaDelPedido(tren);
  return Object.keys(f.materiales).length ? `Taller: llevar material para ${m.nombre.toLowerCase()}` : `Taller: ${m.nombre.toLowerCase()} (esperando el hierro)`;
}

// `ctx`: progreso(), desafio(), jugador() (el estado: pos), materiales() (lo que tenés a mano: { tabla, tronco, piedra }),
// conMateriales(fn), nota(t, sub, nueva), guardar(), refrescarBarra(), sonido(), alClic(el, fn), traducir(t),
// alAbrirPanel(), pedirTexto(texto, inicial, extra) → Promise, aplicarMejoras(tren), diario(tipo, dato).
export function crearTallerJuego(ctx) {
  const progreso = () => ctx.progreso();
  const T_ = (s) => (ctx.traducir ? ctx.traducir(s) : s);
  const activo = () => !ctx.desafio?.() && !!progreso();
  const dia = () => Math.max(1, Math.floor(Number(progreso().dia) || 1));
  const horas = () => Number(progreso().horas) || 0;
  // El estado del tren. Al cargar lo sanea guardado.js; acá, si alguien lo cambió (o no estaba), sólo se completa lo
  // que falta, sin pisar lo que hay (el equipo del tren y sus pruebas también lo escriben)
  const objeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
  function tren() {
    const p = progreso();
    if (!objeto(p.tren)) p.tren = trenNuevo();
    const t = p.tren;
    if (!t.__completo) {
      const n = trenNuevo();
      if (!objeto(t.loco)) t.loco = n.loco;
      else { for (const [k, v] of Object.entries(n.loco)) if (!Object.hasOwn(t.loco, k)) t.loco[k] = v; if (!objeto(t.loco.pintura)) t.loco.pintura = n.loco.pintura; }
      if (!objeto(t.vagones)) t.vagones = n.vagones;
      else for (const k of Object.keys(n.vagones)) if (!Object.hasOwn(t.vagones, k)) t.vagones[k] = false;
      if (!Array.isArray(t.composicion)) t.composicion = [];
      if (!objeto(t.taller)) t.taller = sanearTren(t, p.dia).taller;
      Object.defineProperty(t, '__completo', { value: true, enumerable: false, configurable: true });
    }
    return t;
  }
  const herreria = () => { try { return localAbierto(progreso().aldea, 'herreria'); } catch { return false; } };
  const aplicar = () => { try { ctx.aplicarMejoras?.(tren()); } catch (err) { console.warn('[taller] aplicarMejoras', err); } };

  // ---------------------------------------------------------------- el reloj
  let acum = 1;
  let aplicadoUnaVez = false;
  function actualizar(dt) {
    if (!activo()) return;
    if (!aplicadoUnaVez) { aplicadoUnaVez = true; aplicar(); }
    acum += dt;
    const t = tren();
    // (cada segundo; o enseguida si el reloj saltó: dormiste)
    if (acum < 1 && Math.abs(dia() * 24 + horas() - (t.taller.ultimo || 0)) < 0.5) return;
    acum = 0;
    const r = avanzarTaller(t, dia(), horas(), { herreria: herreria() });
    if (r.piezas || r.empezo) { if (panel) dibujarPanel(true); }
    for (const id of tomarAvisos(t)) anunciar(id);
    // Ernesto viene a la tarde mientras se arma una (ver rutinaAldea en aldea.js)
    const a = progreso().aldea;
    if (a && typeof a === 'object') Object.defineProperty(a, 'tallerArmando', { value: estadoTaller(t) === 'armando', configurable: true, enumerable: false, writable: true });
  }
  function anunciar(id) {
    const m = mejoraDe(id);
    if (!m) return;
    const t = tren();
    let sub = m.dice;
    if (m.efecto.vagon) sub = t.composicion.includes(m.efecto.vagon) ? `Ya está enganchado al tren. ${VAGONES[m.efecto.vagon].dice}.` : `Quedó en el desvío: el tren ya lleva ${VAGONES_MAX} vagones. Elegí cuáles en el taller.`;
    const primera = t.taller.hechas.length === 1;
    ctx.nota(`Martín: «${m.nombre}, ${m.efecto.vagon ? 'listo' : 'lista'}»`, primera ? `${sub} Y de paso arreglamos el galpón.` : sub, true);
    ctx.sonido?.()?.juntar?.();
    ctx.diario?.('taller', id);
    aplicar();
    ctx.guardar?.();
    if (panel) dibujarPanel(true);
  }

  // ---------------------------------------------------------------- E y el aviso
  function accion(js) {
    if (!activo() || !js?.pos || !puedeUsarTaller(js.pos)) return null;
    return { tipo: 'taller-tren', texto: textoAvisoTaller(tren()), hacer: () => abrirPanel() };
  }

  // ---------------------------------------------------------------- el panel
  let panel = null;   // { vista: 'principal'|'pintura'|'silbato'|'composicion', opciones, firma }
  const $ = (id) => (typeof document !== 'undefined' ? document.getElementById(id) : null);
  function abrirPanel() {
    panel = { vista: 'principal', opciones: [], firma: null };
    $('taller-tren-panel')?.classList.remove('oculto');
    dibujarPanel(true);
    ctx.alAbrirPanel?.();
  }
  function cerrarPanel() {
    if (!panel) return;
    panel = null;
    $('taller-tren-panel')?.classList.add('oculto');
  }
  const panelAbierto = () => !!panel;
  // Escape: de una vista de adentro, a la principal; de la principal, se cierra
  function atras() {
    if (!panel) return false;
    if (panel.vista !== 'principal') { panel.vista = 'principal'; dibujarPanel(true); return true; }
    cerrarPanel();
    return true;
  }
  const nombreMat = (m) => textoMateriales(m) || 'nada';
  // Lo que dice Martín arriba, según cómo está el taller
  function dicho() {
    const t = tren(), p = t.taller.pedido;
    if (panel.vista === 'pintura') return 'Elegí el color de cada parte (cada vez que elegís, pasa al siguiente de la paleta). Martín la pinta esta noche.';
    if (panel.vista === 'silbato') return 'El silbato que suena cuando silbás desde la cabina.';
    if (panel.vista === 'composicion') return `Detrás del ténder entran ${VAGONES_MAX} vagones (los andenes no dan para más). Elegí uno para engancharlo o dejarlo en el desvío. Sin ninguno elegido, van los que tengas; si no hay dónde viajar, Ernesto engancha un coche de segunda de los de siempre.`;
    if (!p) {
      const viejo = !t.taller.arreglado;
      return viejo ? 'Martín: «El galpón está como está, pero el foso anda. Pedime una mejora y, de paso, le ponemos chapas nuevas y le calzamos el zócalo.»'
        : 'Martín: «¿Qué le hacemos a la locomotora? Vos traés el material; el hierro lo forja Anselmo y entre Ernesto y yo la armamos.»';
    }
    const m = mejoraDe(p.id), f = faltaDelPedido(t);
    const pide = pideMejora(p.id, p.arreglo);
    const aport = Object.keys(pide).map((k) => `${p.aportado[k] || 0} de ${pide[k]} ${k === 'tabla' ? 'tablas' : k === 'tronco' ? 'troncos' : 'piedras'}`).join(', ');
    const hierro = m.hierro ? ` Piezas de hierro: ${p.hierro} de ${m.hierro} (${herreria() ? `las forja Anselmo, ${HIERRO_POR_DIA} por día` : 'llegan de El Maitén con el tren, una por día, hasta que abra la herrería'}).` : '';
    if (estadoTaller(t) === 'armando') return `En el foso: ${m.nombre.toLowerCase()}${p.arreglo ? ' (y el arreglo del galpón)' : ''}. Ernesto y Martín la están armando: queda lista ${textoListo(p.listo)}.`;
    return `En el taller: ${m.nombre.toLowerCase()}${p.arreglo ? ' (y el arreglo del galpón)' : ''}. Aportado: ${aport || 'nada todavía'}.${hierro}${Object.keys(f.materiales).length ? ` Falta: ${nombreMat(f.materiales)}.` : ''}`;
  }
  // Las opciones de la vista (cada una: { texto, detalle, marca, puede, hacer })
  function opciones() {
    const t = tren(), p = t.taller.pedido, lista = [];
    const volver = { texto: 'Volver', detalle: '', marca: '', puede: true, hacer: () => { panel.vista = 'principal'; } };
    if (panel.vista === 'pintura') {
      for (const [parte, nombre] of Object.entries(PARTES_PINTURA)) {
        const actual = t.loco.pintura[parte];
        lista.push({ texto: nombre, detalle: `— ${nombreColor(actual)}`, marca: 'cambiar', color: colorTren(actual), puede: true, hacer: () => { pintar(t, parte, colorSiguiente(actual)); aplicar(); ctx.guardar?.(); } });
      }
      lista.push(volver);
      return lista;
    }
    if (panel.vista === 'silbato') {
      for (const id of silbatosDe(t)) lista.push({ texto: SILBATOS[id].nombre, detalle: `— ${SILBATOS[id].dice}`, marca: t.loco.silbato === id ? 'el que suena' : 'elegir', puede: true, hecho: t.loco.silbato === id, hacer: () => { elegirSilbato(t, id); aplicar(); ctx.guardar?.(); } });
      lista.push(volver);
      return lista;
    }
    if (panel.vista === 'composicion') {
      for (const id of vagonesHechos(t)) {
        const i = t.composicion.indexOf(id);
        lista.push({ texto: VAGONES[id].nombre, detalle: i >= 0 ? `— enganchado, ${i + 1}° detrás del ténder` : '— en el desvío', marca: i >= 0 ? 'dejar en el desvío' : t.composicion.length >= VAGONES_MAX ? 'no entra' : 'enganchar',
          puede: i >= 0 || t.composicion.length < VAGONES_MAX, hecho: i >= 0,
          hacer: () => { const r = alternarVagon(t, id); if (!r.ok && r.motivo === 'largo') ctx.nota('No entra otro vagón', `Detrás del ténder van ${VAGONES_MAX}: dejá uno en el desvío primero`); aplicar(); ctx.guardar?.(); } });
      }
      for (const id of t.composicion.slice(1)) lista.push({ texto: `Pasar adelante: ${VAGONES[id].corto}`, detalle: '— más cerca de la locomotora', marca: '', puede: true, hacer: () => { adelantarVagon(t, id); aplicar(); ctx.guardar?.(); } });
      lista.push(volver);
      return lista;
    }
    // la principal
    if (p && estadoTaller(t) === 'juntando') {
      const f = faltaDelPedido(t), hay = ctx.materiales?.() || {};
      const daria = Object.fromEntries(Object.entries(f.materiales).map(([k, n]) => [k, Math.min(n, Math.max(0, Math.floor(hay[k] || 0)))]).filter(([, n]) => n > 0));
      if (Object.keys(f.materiales).length) {
        lista.push({ texto: 'Llevar lo que tengo', detalle: `— falta ${nombreMat(f.materiales)}`, marca: Object.keys(daria).length ? `doy ${nombreMat(daria)}` : 'no tenés', puede: Object.keys(daria).length > 0, hacer: aportar });
      }
      lista.push({ texto: `Dejar ${mejoraDe(p.id).nombre.toLowerCase()}`, detalle: '— Martín te devuelve el material', marca: '', puede: true, hacer: () => {
        const r = cancelarPedido(t);
        if (r.ok && Object.keys(r.devuelto).length) ctx.conMateriales?.((m) => { for (const [k, n] of Object.entries(r.devuelto)) m[k] = (m[k] || 0) + n; });
        ctx.nota('Dejaste el pedido', Object.keys(r.devuelto).length ? `Martín te devolvió ${nombreMat(r.devuelto)}` : 'No había nada aportado');
        ctx.refrescarBarra?.(); ctx.guardar?.();
      } });
    }
    lista.push(...delTren(t));
    for (const id of IDS_MEJORAS) {
      const r = puedePedir(t, id);
      if (r.motivo === 'hecha' || r.motivo === 'requiere' || r.motivo === 'pedida') continue;
      const m = MEJORAS_TREN[id];
      const conArreglo = !t.taller.arreglado && !t.taller.hechas.length;
      lista.push({ texto: m.nombre, detalle: `— ${textoPide(id, conArreglo)}${conArreglo ? ' (con el arreglo del galpón)' : ''}`, marca: r.puede ? 'pedir' : 'después', puede: r.puede, mejora: id,
        hacer: () => {
          const q = pedirMejora(t, id, dia(), horas());
          if (!q.ok) { ctx.nota('El foso está ocupado', 'Una mejora por vez: terminá (o dejá) la que está en el taller'); return; }
          ctx.nota(`Pediste: ${m.nombre}`, `Martín: «Traeme ${nombreMat(pideMejora(id, q.pedido.arreglo)) || 'nada más que ganas'}${m.hierro ? `; las ${m.hierro} piezas de hierro se las pido a Anselmo` : ''}. Tarda ${textoDias(id)}.»`, true);
          ctx.guardar?.();
        } });
    }
    return lista;
  }
  // lo de la locomotora que se cambia sin materiales (arriba de las mejoras: así entra en los números del 1 al 9)
  function delTren(t) {
    const lista = [];
    lista.push({ texto: 'La pintura', detalle: `— ${Object.values(t.loco.pintura).every((c) => !c) ? 'la de siempre' : Object.keys(PARTES_PINTURA).map((k) => nombreColor(t.loco.pintura[k]).toLowerCase()).join(', ')}`, marca: 'elegir', puede: true, hacer: () => { panel.vista = 'pintura'; } });
    lista.push({ texto: 'El nombre', detalle: t.loco.nombre ? `— «${t.loco.nombre}»` : '— el de siempre (el de «Personalizar», si tiene)', marca: 'escribir', puede: true, hacer: escribirNombre });
    if (silbatosDe(t).length > 1) lista.push({ texto: 'El silbato', detalle: `— ${SILBATOS[t.loco.silbato].nombre.toLowerCase()}`, marca: 'elegir', puede: true, hacer: () => { panel.vista = 'silbato'; } });
    lista.push({ texto: 'La composición', detalle: `— ténder + ${t.composicion.length ? t.composicion.map((k) => VAGONES[k].corto).join(', ') : vagonesHechos(t).length ? 'los que tenés' : 'los dos coches de segunda de siempre'}`, marca: vagonesHechos(t).length ? 'elegir' : 'sin vagones nuevos', puede: true, hacer: () => { panel.vista = 'composicion'; } });
    return lista;
  }
  function aportar() {
    const t = tren();
    let r = null;
    const hacer = (m) => { r = aportarMejora(t, m, dia(), horas()); for (const [k, n] of Object.entries(r.dado || {})) m[k] = Math.max(0, (m[k] || 0) - n); };
    if (ctx.conMateriales) ctx.conMateriales(hacer); else { const p = progreso(); p.materiales = p.materiales || {}; hacer(p.materiales); }
    if (!r?.ok) { ctx.nota('No tenés nada de lo que falta', `Falta ${nombreMat(r?.faltan || {})}`); return; }
    ctx.sonido?.()?.juntar?.();
    ctx.refrescarBarra?.();
    const m = mejoraDe(t.taller.pedido?.id || '');
    if (r.empezo && t.taller.pedido) ctx.nota(`Llevaste ${nombreMat(r.dado)}`, `Está todo: Ernesto y Martín la arman. Queda lista ${textoListo(t.taller.pedido.listo)}`, true);
    else if (r.completo) ctx.nota(`Llevaste ${nombreMat(r.dado)}`, `El material está. Faltan ${textoPiezas(r.hierroFalta)}: ${herreria() ? 'Anselmo forja dos por día' : 'llegan con el tren, una por día'}`);
    else ctx.nota(`Llevaste ${nombreMat(r.dado)}${m ? ` para ${m.nombre.toLowerCase()}` : ''}`, `Falta ${nombreMat(r.faltan)}`);
    ctx.guardar?.();
  }
  async function escribirNombre() {
    const t = tren();
    if (!ctx.pedirTexto) return;
    const texto = await ctx.pedirTexto('¿Cómo se llama la locomotora? (Martín le pinta las letras en la cabina)', t.loco.nombre || NOMBRE_DE_SIEMPRE, { max: LARGO_NOMBRE });
    if (typeof texto === 'string' && ponerNombre(t, texto)) {
      ctx.nota(`La locomotora se llama «${t.loco.nombre}»`, 'Martín pinta las letras esta noche, a pulso');
      aplicar(); ctx.guardar?.();
    }
    if (panel) dibujarPanel(true);
  }
  function elegirPanel(i) {
    if (!panel) return;
    const op = (panel.opciones.length ? panel.opciones : opciones())[i];
    if (!op) return;
    if (!op.puede) { if (op.mejora) ctx.nota('El foso está ocupado', 'Una mejora por vez: terminá (o dejá) la que está en el taller'); return; }
    op.hacer();
    if (panel) dibujarPanel(true);
  }
  function dibujarPanel(forzar = false) {
    if (!panel) return;
    const ops = opciones();
    panel.opciones = ops;
    const firma = `${panel.vista}|${dicho()}|${ops.map((o) => `${o.texto}${o.detalle}${o.marca}${o.puede}`).join(';')}`;
    if (!forzar && firma === panel.firma) return;
    panel.firma = firma;
    const div = $('taller-tren-panel');
    if (!div) return;
    div.querySelector('.quien').textContent = T_(panel.vista === 'pintura' ? 'La pintura de la locomotora' : panel.vista === 'silbato' ? 'El silbato' : panel.vista === 'composicion' ? 'La composición del tren' : 'El taller ferroviario');
    div.querySelector('.dicho').textContent = T_(dicho());
    const ul = div.querySelector('ul');
    ul.innerHTML = '';
    ops.forEach((op, i) => {
      const li = document.createElement('li');
      li.className = op.puede ? (op.hecho ? 'hecho' : '') : 'falta';
      const b = document.createElement('b');
      b.textContent = `${i < 9 ? `${i + 1}. ` : ''}${T_(op.texto)}`;
      if (op.color) { const m = document.createElement('span'); m.style.cssText = `display:inline-block;width:14px;height:14px;border-radius:3px;margin-left:6px;vertical-align:-2px;background:${op.color};box-shadow:0 0 0 1px rgba(0,0,0,.35)`; b.appendChild(m); }
      const span = document.createElement('span');
      span.textContent = T_(op.detalle);
      const marca = document.createElement('i');
      marca.textContent = T_(op.marca);
      li.append(b, span, marca);
      ctx.alClic?.(li, () => elegirPanel(i));
      ul.appendChild(li);
    });
    div.querySelector('.seguir').textContent = T_(panel.vista === 'principal' ? 'Elegí con el número o con un clic · E o Escape para salir' : 'Elegí con el número o con un clic · Escape para volver');
  }
  // para marcarHud de main.js (las listas del HUD: teclado, mouse y mando)
  const lista = () => ({ ul: $('taller-tren-panel')?.querySelector('ul') || null, pie: $('taller-tren-panel')?.querySelector('.seguir') || null, elegir: (i) => elegirPanel(i) });

  return {
    activo, actualizar, accion, abrirPanel, cerrarPanel, panelAbierto, elegirPanel, atras, lista, tren, aplicar,
    redibujar: () => dibujarPanel(false),
    // para las pruebas
    estado: () => ({ vista: panel?.vista || null, opciones: panel ? panel.opciones.map((o) => ({ texto: o.texto, detalle: o.detalle, marca: o.marca, puede: o.puede })) : [], dicho: panel ? dicho() : null, tren: JSON.parse(JSON.stringify(tren())) }),
  };
}
