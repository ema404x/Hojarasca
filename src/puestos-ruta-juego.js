// 4.6: los puestos de ruta en el juego: la tecla E y su aviso (con la misma función, `accion`), las notas y lo que se rehace al reparar.
// Las reglas están en puestos-ruta.js y lo que se ve en puestos-ruta-mundo.js. main.js lo crea una vez (sólo en el Relax) y lo usa en
// pocos lugares, en bloques marcados «4.6 puestos»:
//   · E junto a un puesto sin terminar: paga la etapa que sigue (pesos, tablas y piedras); el aviso dice cuál y cuánto cuesta;
//   · reparado: adentro, E duerme en el catre (de noche) o una siesta; en la ventanilla, E abre el panel del puesto (comprar y vender,
//     como en las paradas, sin fletes; el del Riel Sur es el de la trochita, con fletes); en el alero del depósito, E guarda lo que llevás
//     (o, sin nada a mano, saca todo);
//   · F junto al fogón de un puesto reparado lo prende (main.js, con la leña de siempre); el banco y el tronco son asientos.
import { PUESTOS_RUTA, IDS_PUESTOS, puestoCerca, puntoDe, aMundo, adentro, etapaDe, reparado, proximaEtapa, repararEtapa, faltaPara, textoReparar, textoFalta, textoCosto, guardarEnPuesto, sacarDePuesto, resumenDeposito, hayEnDeposito, enPalabras, nombreMaterial, GUARDA, ETAPAS_TOTAL, CAJA_PUESTO } from './puestos-ruta.js';
import { formatoPesos } from './economia.js';

export const RADIO_PUESTO = { reparar: 5.8, mostrador: 1.6, deposito: 1.8, fogon: 2.4 };

// `ctx`: { progreso(), desafio(), mundo (puestos-ruta-mundo), nota(t, sub, nueva), guardar(), refrescarBarra(), sonido,
//          abrirComercio(parada), dormir(op), horas() }
export function crearPuestosRutaJuego(ctx) {
  const P = () => ctx.progreso();
  const activo = () => !ctx.desafio?.() && !!P();
  const materiales = () => { const p = P(); if (!p.materiales || typeof p.materiales !== 'object') p.materiales = {}; return p.materiales; };
  const dist = (pos, q) => (q ? Math.hypot(pos.x - q.x, pos.z - q.z) : Infinity);
  // la «parada» de un puesto de ruta para el panel del comercio (comercio-mundo.js): sin fletes, se cierra si te alejás del mostrador
  const paradas = {};
  function paradaDe(id) {
    if (!paradas[id]) {
      const m = puntoDe(id, 'mostrador');
      paradas[id] = { nombre: PUESTOS_RUTA[id].nombre, puestoRuta: id, sinFletes: true, cerca: (pos) => !!pos && dist(pos, m) < RADIO_PUESTO.mostrador + 1.8 && reparado(P(), id) };
    }
    return paradas[id];
  }

  // ------------------------------------------------ reparar
  function reparar(id) {
    const p = P();
    let r = null;
    r = repararEtapa(p, id, materiales());
    if (!r.ok) {
      if (r.motivo === 'reparado') return false;
      const s = proximaEtapa(p, id);
      ctx.nota(r.motivo === 'plata' && !r.falta.materiales.length ? 'Falta plata para esta etapa' : 'Falta para esta etapa', `${textoFalta(r.falta)}. La etapa ${s.indice + 1} (${s.nombre}) cuesta ${textoCosto(s)}`);
      return false;
    }
    ctx.mundo?.refrescar(id);
    ctx.sonido?.juntar?.();
    const def = PUESTOS_RUTA[id];
    if (r.reparado) {
      ctx.nota(`¡${def.nombre} reparado!`, `${r.hecho}. ${def.quien} abre con ${formatoPesos(CAJA_PUESTO)} en la caja`, true);
    } else {
      const s = proximaEtapa(p, id);
      ctx.nota(`Etapa ${r.etapa} de ${ETAPAS_TOTAL}: ${r.nombre}`, `${r.hecho}. Falta: ${s.nombre} (${textoCosto(s)})`, true);
    }
    ctx.refrescarBarra?.(); ctx.guardar?.();
    return true;
  }

  // ------------------------------------------------ el depósito
  function textoDeposito(id) {
    const m = materiales(), r = resumenDeposito(P(), id);
    if (GUARDA.some((k) => (m[k] || 0) > 0)) return `Guardar en el depósito del puesto (${r})${hayEnDeposito(P(), id) ? ' · Supr: sacar' : ''}`;   // 4.10.1: Supr saca todo, lleves lo que lleves
    if (hayEnDeposito(P(), id)) return `Sacar del depósito del puesto (${r})`;
    return `Depósito del puesto vacío (${r})`;
  }
  // 4.10.1: sacar todo lo guardado sin que importe lo que llevás encima (como Supr en los depósitos comunes, 4.4.2 C7): antes, con
  // cualquier material de GUARDA en la mochila la E siempre guardaba y el depósito de un puesto no se podía vaciar.
  function sacarTodo(id) {
    const p = P(), m = materiales();
    if (!hayEnDeposito(p, id)) { ctx.nota('El depósito del puesto está vacío', resumenDeposito(p, id)); return true; }
    const sacado = sacarDePuesto(p, id, m, ctx.lugarEn || null);   // 4.7 carga: sólo sale lo que entra en la mochila
    if (!Object.keys(sacado).length) { ctx.nota('Mochila llena: no te entra nada del depósito', 'Hacé lugar en la mochila: lo guardado sigue en el puesto'); return true; }
    ctx.sonido?.juntar?.();
    ctx.nota(hayEnDeposito(p, id) ? 'Sacaste lo que te entra del depósito del puesto' : 'Sacaste todo del depósito del puesto', enPalabras(sacado));
    ctx.mundo?.refrescar(id);
    ctx.refrescarBarra?.(); ctx.guardar?.();
    return true;
  }
  // Supr junto al alero del depósito de un puesto reparado: saca todo. Devuelve false si no hay depósito a mano (el resto de Supr sigue).
  function sacarTodoCerca(js) {
    if (!activo() || !js?.pos) return false;
    const c = puestoCerca(js.pos, 8);
    if (!c || !reparado(P(), c.id) || adentro(c.id, js.pos.x, js.pos.z)) return false;
    if (dist(js.pos, puntoDe(c.id, 'deposito')) >= RADIO_PUESTO.deposito) return false;
    return sacarTodo(c.id);
  }
  function usarDeposito(id) {
    const p = P(), m = materiales();
    if (GUARDA.some((k) => (m[k] || 0) > 0)) {
      const { guardado, sobra } = guardarEnPuesto(p, id, m);
      if (Object.keys(guardado).length) {
        ctx.sonido?.juntar?.();
        ctx.nota('Guardaste en el depósito del puesto', `${enPalabras(guardado)}. ${resumenDeposito(p, id)}${sobra.length ? `. No entró el resto de ${sobra.map((k) => nombreMaterial(k)).join(' y ')}: está lleno` : ''}`, true);
      } else ctx.nota('El depósito del puesto está lleno', `${resumenDeposito(p, id)}. Supr saca todo`);
    } else if (hayEnDeposito(p, id)) {
      return sacarTodo(id);
    } else {
      ctx.nota('El depósito del puesto está vacío', `Traé ${GUARDA.map((k) => nombreMaterial(k)).join(', ')} y apretá E acá: guarda hasta 40 de cada uno`);
      return true;
    }
    ctx.mundo?.refrescar(id);
    ctx.refrescarBarra?.(); ctx.guardar?.();
    return true;
  }

  // ------------------------------------------------ la E y el aviso (la misma función: { tipo, texto, hacer } o null)
  function accion(js) {
    if (!activo() || !js?.pos) return null;
    const c = puestoCerca(js.pos, 8);
    if (!c) return null;
    const id = c.id, p = P(), pos = js.pos;
    if (!reparado(p, id)) {
      if (c.d > RADIO_PUESTO.reparar) return null;
      return { tipo: 'reparar', id, texto: textoReparar(p, id), hacer: () => reparar(id) };
    }
    if (adentro(id, pos.x, pos.z)) {
      const h = Number(ctx.horas?.()) || 12, noche = h >= 19.5 || h < 6;
      return { tipo: 'dormir', id, texto: noche ? 'Dormir en el catre del puesto' : 'Dormir una siesta en el catre del puesto', hacer: () => ctx.dormir?.({ puestoRuta: id }) };
    }
    // (el del Riel Sur comercia por el puesto de cargas de la trochita, que va antes en la E y en el aviso)
    if (!PUESTOS_RUTA[id].parada && dist(pos, puntoDe(id, 'mostrador')) < RADIO_PUESTO.mostrador) {
      return { tipo: 'comerciar', id, texto: `Comerciar en ${PUESTOS_RUTA[id].el}`, hacer: () => ctx.abrirComercio?.(paradaDe(id)) };
    }
    if (dist(pos, puntoDe(id, 'deposito')) < RADIO_PUESTO.deposito) return { tipo: 'deposito', id, texto: textoDeposito(id), hacer: () => usarDeposito(id) };
    return null;
  }
  // El fogón de un puesto reparado a mano (para la F): { x, y, z, id } o null. `y` la pone main.js (la altura del terreno).
  function fogonCerca(pos) {
    if (!activo() || !pos) return null;
    const c = puestoCerca(pos, 9);
    if (!c || !reparado(P(), c.id)) return null;
    const f = puntoDe(c.id, 'fogon');
    return dist(pos, f) < RADIO_PUESTO.fogon ? { ...f, id: c.id } : null;
  }

  return {
    accion, fogonCerca, reparar, usarDeposito, sacarTodoCerca, paradaDe,
    // el mapa: los puestos que no son parada (el del Riel Sur sale con las paradas), con cómo están
    marcasDelMapa: () => (activo() ? IDS_PUESTOS.filter((id) => !PUESTOS_RUTA[id].parada).map((id) => ({ x: PUESTOS_RUTA[id].pos.x, z: PUESTOS_RUTA[id].pos.z, nombre: reparado(P(), id) ? PUESTOS_RUTA[id].nombre : `${PUESTOS_RUTA[id].nombre} (abandonado)` })) : []),
    // (para las pruebas: dónde queda cada puesto y cada cosa)
    def: (id) => PUESTOS_RUTA[id] || null, punto: (id, cual) => puntoDe(id, cual), aMundo: (id, lx, lz) => aMundo(id, lx, lz),
    estado: () => Object.fromEntries(IDS_PUESTOS.map((id) => [id, { etapa: etapaDe(P(), id), reparado: reparado(P(), id), falta: faltaPara(P(), id, materiales()) }])),
  };
}
