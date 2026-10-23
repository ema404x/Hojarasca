// 4.10 base: los trofeos de la base, en el mundo (las reglas puras están en desafio-trofeos.js y el modelo en desafio-trofeos-formas.js).
//
// Cada segundo mira cómo va la partida (el último mandamás que cayó, la puertita del Coihue, el Rey Duende, la cueva del nido) y, si
// se ganó un trofeo nuevo, lo anota en `desafio.crece.trofeos` y lo cuelga en el tablero (la malla del tablero se rehace con los
// trofeos que corresponden: `datos.colgados`). Mientras haya un tablero en pie, los trofeos dan sus bonos con el origen 'trofeo';
// si no hay tablero (se desarmó) los bonos se van y los trofeos quedan guardados; si el tablero lo tiran los duendes, los trofeos
// se pierden con él.
import { puedeAbordar } from './desafio-asedio.js';
import { ORIGEN_TROFEO, POR_ID, TROFEOS, ganados, ganarTrofeo, trofeosQueCorresponden, textoGanado, textoTablero } from './desafio-trofeos.js';

export const ID_TABLERO = 'tablero-trofeos';
const RADIO_E = 3.4;   // a cuántos metros del tablero la E lo muestra

export function crearTrofeosMundo(obras, sonido, api, bonos) {
  const completa = (o) => o.datos.etapas >= o.plano.etapas.length && o !== obras.editando;
  const tableros = () => obras.obras.filter((o) => o.plano.id === ID_TABLERO && completa(o));
  const crece = () => {
    const d = api.D();
    if (!d.crece || typeof d.crece !== 'object') d.crece = { trofeos: {}, perro: { noches: 0 }, bonos: {} };
    if (!d.crece.trofeos || typeof d.crece.trofeos !== 'object') d.crece.trofeos = {};
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
    for (const id of trofeosQueCorresponden({
      jefeCaido: d.jefeCaido, puertitaAbierta: !!d.asedio && puedeAbordar(d.asedio), victoria: !!d.victoria, nidoCaido: !!d.nido?.caido,
    })) if (ganarTrofeo(crece().trofeos, id, d.oleadas)) nuevos.push(id);
    return nuevos;
  }
  function avisarNuevos(nuevos, hayTablero) {
    nuevos.forEach((id, i) => {
      const t = textoGanado(id);
      setTimeout(() => {
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
  function avisoCerca(pos) {
    const o = cercano(pos);
    if (!o) return null;
    return `Ver los trofeos del tablero (${ganados(crece().trofeos).length} de ${TROFEOS.length})`;
  }
  function usarCerca(pos) {
    const o = cercano(pos);
    if (!o) return false;
    const t = textoTablero(crece().trofeos, true);
    api.nota(t.titulo, t.texto, true);
    return true;
  }
  const hayTablero = () => tableros().length > 0;
  function limpiar() { firma = null; }
  return { actualizar, alCaer, cerca, avisoCerca, usarCerca, revisarGanados, aplicarBonos, colgar, tableros, hayTablero, limpiar, avisarNuevos };
}
