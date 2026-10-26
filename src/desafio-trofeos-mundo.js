// 4.10 base: los trofeos de la base, en el mundo (las reglas puras están en desafio-trofeos.js y el modelo en desafio-trofeos-formas.js).
//
// Cada segundo mira cómo va la partida (el último mandamás que cayó, la puertita del Coihue, el Rey Duende, la cueva del nido) y, si
// se ganó un trofeo nuevo, lo anota en `desafio.crece.trofeos` y lo cuelga en el tablero (la malla del tablero se rehace con los
// trofeos que corresponden: `datos.colgados`). Mientras haya un tablero en pie, los trofeos dan sus bonos con el origen 'trofeo';
// si no hay tablero (se desarmó) los bonos se van y los trofeos quedan guardados; si el tablero lo tiran los duendes, los trofeos
// se pierden con él.
import { puedeAbordar } from './desafio-asedio.js';
import { ORIGEN_TROFEO, POR_ID, TROFEOS, ganados, ganarTrofeo, trofeosNuevos, textoGanado, textoTablero, filasPanelTrofeos } from './desafio-trofeos.js';
import { creceNuevo } from './desafio-crece.js';

export const ID_TABLERO = 'tablero-trofeos';
const RADIO_E = 3.4;   // a cuántos metros del tablero la E lo muestra

export function crearTrofeosMundo(obras, sonido, api, bonos) {
  const completa = (o) => o.datos.etapas >= o.plano.etapas.length && o !== obras.editando;
  const tableros = () => obras.obras.filter((o) => o.plano.id === ID_TABLERO && completa(o));
  const crece = () => {
    const d = api.D();
    if (!d.crece || typeof d.crece !== 'object') d.crece = creceNuevo();
    if (!d.crece.trofeos || typeof d.crece.trofeos !== 'object') d.crece.trofeos = {};
    if (!d.crece.vistos || typeof d.crece.vistos !== 'object') d.crece.vistos = creceNuevo().vistos;
    return d.crece;
  };

  // Aplica los bonos de los trofeos ganados (o los saca si no hay tablero). Sólo cuando algo cambió.
  let firma = null;
  function aplicarBonos(enPie) {
    const d = api.D();
    const lista = enPie ? ganados(crece().trofeos) : [];
    const f = lista.join(',');
    if (f === firma) return;
    firma = f;
    bonos.quitarBonosDeOrigen(d, ORIGEN_TROFEO);
    for (const id of lista) bonos.sumarBono(d, ORIGEN_TROFEO, POR_ID[id].bono.clave, POR_ID[id].bono.valor);
  }
  // Los trofeos colgados en cada tablero: si no son los que corresponden, se rehace la malla.
  function colgar(lista) {
    const quiero = ganados(crece().trofeos).join(',');
    for (const o of lista) {
      const hay = Array.isArray(o.datos.colgados) ? o.datos.colgados.join(',') : '';
      if (hay === quiero) continue;
      o.datos.colgados = ganados(crece().trofeos);
      obras.rehacer?.(o);
      api.alGuardarObras?.();
    }
  }

  // ¿Qué trofeos corresponden ahora? Los gana (con aviso) los que faltan.
  function revisarGanados() {
    const d = api.D();
    const nuevos = [];
    // 4.10.1: la partida corta se gana sin Coihue ni Rey: ganarla no da la piña ni la corona
    for (const id of trofeosNuevos({
      jefeCaido: d.jefeCaido, puertitaAbierta: !!d.asedio && puedeAbordar(d.asedio), reyCaido: !!d.asedio?.reyCaido,
      victoria: (!!d.victoria && d.meta?.modo !== 'corta') || !!d.asedio?.ganado, nidoCaido: !!d.nido?.caido,
    }, crece().vistos)) if (ganarTrofeo(crece().trofeos, id, d.oleadas)) nuevos.push(id);
    return nuevos;
  }
  const esperar = (f, ms) => (api.esperar ? api.esperar(f, ms) : setTimeout(f, ms));
  function avisarNuevos(nuevos, hayTablero) {
    nuevos.forEach((id, i) => {
      const t = textoGanado(id);
      esperar(() => {
        api.nota(t.titulo, hayTablero ? `${t.texto} · ya está colgado en el tablero` : `${t.texto} · armá un tablero de trofeos (O → Defensa) para colgarlo`, true);
        sonido?.pulsar?.(79, { dur: 1.4, vol: 0.1, destino: sonido.bus?.efectos });
      }, 2400 + i * 2400);
    });
  }

  let acum = 9;
  function actualizar(dt) {
    acum += dt;
    if (acum < 1) return;
    acum = 0;
    const lista = tableros();
    const nuevos = revisarGanados();
    colgar(lista);
    aplicarBonos(lista.length > 0);
    if (nuevos.length) avisarNuevos(nuevos, lista.length > 0);
  }

  // Los duendes tiraron obras: si entre ellas había un tablero, los trofeos se pierden con él.
  function alCaer(caidas) {
    if (!caidas?.some((o) => o.plano?.id === ID_TABLERO)) return false;
    const c = crece();
    if (!Object.keys(c.trofeos).length) return false;
    c.trofeos = {};
    // si queda otro tablero en pie sigue con lo que tiene (nada); los bonos se recalculan en el próximo segundo
    firma = null;
    aplicarBonos(false);
    api.nota('Se cayó el tablero de trofeos', 'Los duendes lo tiraron y los trofeos se perdieron con él', true);
    api.guardar?.();
    return true;
  }

  // La E junto al tablero: qué trofeos tenés y qué da cada uno.
  function cercano(pos) {
    let mejor = null, d0 = RADIO_E;
    for (const o of tableros()) {
      const d = Math.hypot(o.datos.x - pos.x, o.datos.z - pos.z);
      if (d < d0) { d0 = d; mejor = o; }
    }
    return mejor;
  }
  const cerca = (pos) => !!cercano(pos);
  // 4.10.2: a cuántos metros está el tablero más cercano (para decidir entre él y una puerta pegada); Infinity si no hay
  const distancia = (pos) => { const o = cercano(pos); return o ? Math.hypot(o.datos.x - pos.x, o.datos.z - pos.z) : Infinity; };
  function avisoCerca(pos) {
    const o = cercano(pos);
    if (!o) return null;
    return `Ver los trofeos del tablero (${ganados(crece().trofeos).length} de ${TROFEOS.length})`;
  }
  // 4.11.1 (U12): el tablero es un panel que se queda hasta que lo cerrás (E o Escape), como los otros paneles del HUD. Se arma la
  // primera vez que se abre; se cierra solo si te alejás del tablero o si el tablero desaparece (los duendes lo tiran, o lo desarmás).
  const txt = (x) => (api.textoPanel ? api.textoPanel(x) : x);
  let panel = null, abierto = false, tableroAbierto = null;
  function armarPanel() {
    if (panel) return panel;
    const raiz = typeof document === 'undefined' ? null : (document.getElementById?.('hud') || document.body);
    if (!raiz) return null;   // (sin DOM, como en las pruebas de Node: queda la cuenta de abierto/cerrado)
    panel = document.createElement('div');
    panel.className = 'trueque oculto';
    panel.id = 'trofeos-panel';
    panel.innerHTML = '<p class="quien"></p><p class="dicho"></p><ul></ul><p class="seguir"></p>';
    raiz.appendChild(panel);
    return panel;
  }
  function dibujarPanel() {
    const p = armarPanel();
    if (!p) return;
    const t = crece().trofeos, g = ganados(t);
    p.querySelector('.quien').textContent = txt('Tablero de trofeos');
    p.querySelector('.dicho').textContent = txt(`Tenés ${g.length} de ${TROFEOS.length}. Dan su bono mientras el tablero esté en pie`);
    const ul = p.querySelector('ul');
    ul.innerHTML = '';
    for (const f of filasPanelTrofeos(t)) {
      const li = document.createElement('li');
      li.className = f.ganado ? 'hecho' : 'falta';
      const tit = document.createElement('b'); tit.textContent = txt(f.titulo);
      const det = document.createElement('span'); det.textContent = ` — ${txt(f.detalle)}`;
      li.append(tit, det);
      ul.appendChild(li);
    }
    p.querySelector('.seguir').textContent = txt('E o Escape para cerrar el tablero');
  }
  function abrirPanel(o) {
    if (abierto) return true;
    abierto = true; tableroAbierto = o || null;
    dibujarPanel();
    armarPanel()?.classList.remove('oculto');
    return true;
  }
  function cerrarPanel() {
    if (!abierto) return;
    abierto = false; tableroAbierto = null;
    panel?.classList.add('oculto');
  }
  // Cada cuadro con el panel abierto: si el tablero ya no está o te alejaste, se cierra
  function vigilarPanel(pos) {
    if (!abierto) return;
    const aun = tableroAbierto && tableros().includes(tableroAbierto);
    if (!aun || !pos || Math.hypot(tableroAbierto.datos.x - pos.x, tableroAbierto.datos.z - pos.z) > RADIO_E + 1.5) cerrarPanel();
  }
  function usarCerca(pos) {
    const o = cercano(pos);
    if (!o) return false;
    return abrirPanel(o);
  }
  const hayTablero = () => tableros().length > 0;
  function limpiar() { firma = null; cerrarPanel(); }
  return { actualizar, alCaer, cerca, distancia, avisoCerca, usarCerca, panelAbierto: () => abierto, cerrarPanel, vigilarPanel, dibujarPanel, revisarGanados, aplicarBonos, colgar, tableros, hayTablero, limpiar, avisarNuevos };
}
