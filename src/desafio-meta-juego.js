// 4.10 partidas: el enganche de «lo de entre partidas» con el juego (ver desafio-meta.js para las reglas puras).
//
// Lo que hace:
//   · guarda y lee las semillas del Coihue, los desbloqueos, los finales vistos y los récords (clave aparte del guardado de cada
//     partida, con copia de respaldo; si el almacenamiento falla, sigue en memoria durante la sesión);
//   · empieza una partida con lo elegido (gasta las semillas, deja la `meta` en la partida y aplica el arranque);
//   · al terminar una partida (ganada, corrida terminada o dejada para empezar otra) entrega la semilla y anota los puntos;
//   · al ganar, elige el final según cómo se jugó.
import { fijarPartidaMeta } from './desafio-reglas.js';
import {
  leerMeta, guardarMeta, sanearMeta, validarEleccion, gastarSemillas, metaDePartida, efectosDe, modoDe, terminarPartida, anotarVictoria,
  registrarPuntos, puntosDe, anotarFinal, elegirFinal, estadoDeFinal, nochesLimpias, textoFinal, epilogoFinal, FINALES, MODOS,
} from './desafio-meta.js';

// `ctx`: { almacen(), progreso(), desafio(), esSinFin(), sumarMaterial(k, n), nota(t, sub, nueva), guardar(), posJugador(), sumarBono|null }
export function crearMetaJuego(ctx) {
  let cache = null;
  const almacen = () => { try { return ctx.almacen?.() || null; } catch { return null; } };
  function leer() {
    if (!cache) cache = leerMeta(almacen());
    return cache;
  }
  // Si el almacenamiento falla, la copia en memoria sigue valiendo hasta cerrar el juego.
  function guardar(m) {
    cache = sanearMeta(m);
    const a = almacen();
    return a ? guardarMeta(a, cache) : false;
  }
  const dPartida = () => ctx.progreso()?.desafio || null;

  // La `meta` de la partida: una partida vieja (o la corrida sin fin) no la tiene y se la crea neutra (campaña sin nada).
  function asegurarMeta() {
    const d = dPartida();
    if (!d) return null;
    if (!d.meta) { d.meta = metaDePartida({ modo: ctx.esSinFin() ? 'sinfin' : 'normal' }); fijarPartidaMeta(d.meta); }
    return d.meta;
  }
  // Al cargar la partida: el módulo de reglas toma el modo, las ventajas y las reglas de la partida.
  function alCargar() { fijarPartidaMeta(dPartida()?.meta || null); }

  // ---------------------------------------------------------------- empezar
  function iniciar(eleccion) {
    const d = dPartida();
    if (!d) return false;
    const modoFijo = ctx.esSinFin() ? 'sinfin' : null;
    const v = validarEleccion(leer(), { ...eleccion, modo: modoFijo || eleccion.modo });
    if (!v.ok) return false;
    const gastada = gastarSemillas(leer(), v.costo);
    if (!gastada) return false;
    guardar(gastada);
    d.meta = metaDePartida({ modo: modoFijo || eleccion.modo, ventajas: v.ventajas, reglas: v.reglas });
    fijarPartidaMeta(d.meta);
    aplicarInicio();
    return true;
  }
  // El arranque de las ventajas (una sola vez por partida: `aplicado`).
  function aplicarInicio() {
    const d = dPartida();
    if (!d?.meta || d.meta.aplicado) return;
    const e = efectosDe(d.meta);
    d.meta.aplicado = true;
    for (const k of ['tabla', 'tronco']) if (e.inicio[k] > 0) ctx.sumarMaterial?.(k, e.inicio[k]);
    if (e.inicio.flechas > 0) d.flechas = Math.min(999, (d.flechas || 0) + e.inicio.flechas);
    if (e.inicio.miel > 0) d.miel = Math.min(99, (d.miel || 0) + e.inicio.miel);
    // los vecinos: sólo se toca lo de la ayuda, sin reemplazar la aldea (nunca se baja)
    if (Object.keys(e.ayuda).length && d.aldea?.ayuda) {
      const sube = {};
      for (const [k, n] of Object.entries(e.ayuda)) if (Object.hasOwn(d.aldea.ayuda, k)) sube[k] = Math.max(d.aldea.ayuda[k] || 0, n);
      Object.assign(d.aldea.ayuda, sube);
    }
    // los bonos del personaje, por el contrato de «guardián» (si el juego todavía no lo trae, no hay a dónde sumarlos)
    if (typeof ctx.sumarBono === 'function') for (const [k, n] of Object.entries(e.bonos)) if (n) ctx.sumarBono(d, 'ventaja', k, n);
    if (e.inicio.trampa > 0) setTimeout(() => ponerTrampa(e.inicio.trampa), 3500);
    ctx.guardar?.();
  }
  // La trampa de miel lista: en un anillo alrededor de donde empezás, el primer lugar que sirva. Si ninguno sirve, se dan las
  // tablas para armarla (la miel ya se dio).
  function ponerTrampa(cuantas) {
    const des = ctx.desafio?.();
    const p = ctx.posJugador?.();
    if (!des?.colocarTrampaMiel || !p) { ctx.sumarMaterial?.('tabla', 2); return; }
    let puesta = 0;
    for (const r of [7, 9, 11, 13]) {
      for (let i = 0; i < 8 && puesta < cuantas; i++) {
        const a = (i / 8) * Math.PI * 2 + 0.4;
        const res = des.colocarTrampaMiel(p.x + Math.cos(a) * r, p.z + Math.sin(a) * r, { gratis: true });
        if (res?.ok) { puesta++; break; }
      }
      if (puesta >= cuantas) break;
    }
    if (puesta) ctx.nota?.('Una trampa de miel ya armada', 'La dejaron cerca de tu base: los duendes que la pisan quedan pegados');
    else ctx.sumarMaterial?.('tabla', 2);
  }

  // ---------------------------------------------------------------- terminar
  // `victoria`: se ganó (el Coihue o el mandamás). Entrega la semilla (si hay mínimo de noches y no se dio ya) y anota los puntos
  // en el récord del modo. Devuelve el resumen para la pantalla, o null si ya estaba hecho.
  function terminar({ victoria = false } = {}) {
    const d = dPartida();
    if (!d) return null;
    const meta = asegurarMeta();
    if (meta.semillaDada) return null;
    const modo = modoDe(meta);
    const r = terminarPartida(leer(), { noches: d.noches, yaDada: false });
    let m = r.meta;
    if (victoria) m = anotarVictoria(m, modo);
    meta.semillaDada = true;
    const mult = efectosDe(meta).mult;
    const puntos = puntosDe({ noches: d.noches, abatidos: d.abatidos, victoria, mult });
    let puesto = 0;
    if ((d.noches || 0) > 0) {
      const reg = registrarPuntos(m, modo, { puntos, noches: d.noches, abatidos: d.abatidos, victoria, mult, fecha: new Date().toISOString().slice(0, 10), codigo: d.semilla });
      m = reg.meta; puesto = reg.puesto;
    }
    guardar(m);
    ctx.guardar?.();
    return { semilla: r.semilla, puntos, puesto, mult, saldo: m.semillas, modo, noches: d.noches || 0 };
  }
  // Ganó: la semilla, los puntos y el final. `ultimo` queda para la pantalla de victoria.
  let ultimo = null;
  function alVencer() {
    const d = dPartida();
    if (!d) return null;
    const meta = asegurarMeta();
    const cierre = terminar({ victoria: true });
    const est = estadoDeFinal(d);
    const id = elegirFinal(est);
    meta.final = id;
    guardar(anotarFinal(leer(), id));
    ctx.guardar?.();
    ultimo = { ...(cierre || {}), final: id, nombreFinal: FINALES[id].nombre, texto: textoFinal(id, modoDe(meta) === 'corta' ? 'corta' : 'normal', nochesLimpias(est)), epilogo: epilogoFinal(id), modoNombre: MODOS[modoDe(meta)].nombre };
    return ultimo;
  }
  // El cierre de la cueva repite el final de la partida con su epílogo.
  function final() {
    const d = dPartida();
    const id = d?.meta?.final;
    if (!id || !Object.hasOwn(FINALES, id)) return null;
    return ultimo && ultimo.final === id ? ultimo : { final: id, nombreFinal: FINALES[id].nombre, epilogo: epilogoFinal(id) };
  }

  return { leer, guardar, asegurarMeta, alCargar, iniciar, aplicarInicio, terminar, alVencer, final, get ultimo() { return ultimo; }, ponerTrampa };
}
