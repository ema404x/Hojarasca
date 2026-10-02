// 3.1: los eventos del valle en la partida (ver `eventos-valle.js` para las reglas).
// Decide cuándo mostrar la tarjeta de un evento o de "lo que pasó después", cobra lo que
// pide la opción elegida y aplica sus efectos en el mundo: materiales, gratitud, horas,
// la leña, la huerta, una pieza volteada por el viento, una cosa nueva, una visita.
//
// Sin THREE: lo del mundo lo hace el juego por medio de `ctx` (ver `historia-ui.js`).

import { EVENTO_VALLE, SEGUIMIENTOS, sanearEventosValle, revisarEventos, forzarEvento, elegirOpcion, seguimientoListo, cerrarSeguimiento, sumarGratitud, faltaPara, nombreCosa, nombreVecinoEvento } from './eventos-valle.js';
import { mesaPuesta, VISITANTES, VISITA } from './visitas.js';
import { TRUEQUES } from './trueque.js';
import { puedeLlegarPoblador, llamarPoblador } from './pueblo.js';

// lo que el viento puede voltear: piezas chicas y sueltas, que no estén bajo techo
const LIVIANAS = ['tendal', 'maceton', 'cerco', 'silla-campo', 'banco', 'mesa-campo', 'lena'];

export function crearEventosValleUi(ctx, tarjetas) {
  let saneado = null;
  function ev() {
    const p = ctx.progreso();
    if (saneado !== p || !p.eventosValle) { p.eventosValle = sanearEventosValle(p.eventosValle); saneado = p; }
    return p.eventosValle;
  }
  // lo que miran las condiciones de los eventos
  function estado() {
    const p = ctx.progreso();
    const ex = ctx.extra();
    let pron = null;
    try {
      const hoy = (ctx.pronostico?.() || [])[0];
      if (hoy) pron = { temporal: !!hoy.tormenta || hoy.viento === 'fuerte', helada: /helada/.test(hoy.texto || '') };
    } catch { pron = null; }
    return {
      dia: Math.max(1, Math.floor(Number(p.dia) || 1)), horas: Number(p.horas) || 0,
      vecinos: ex.vecinos !== false, viaje: !!p.entradas?.viaje,
      sembrados: Object.keys(p.huerta || {}).length,
      lluvia: (Number(ctx.lluvia?.()) || 0) > 0.2,
      pronostico: pron,
    };
  }
  const tengo = () => { const p = ctx.progreso(); return { materiales: p.materiales || {}, cosas: p.cosas || {}, ramitas: p.ramitas || 0 }; };

  function cobrar(pide) {
    const p = ctx.progreso();
    for (const [k, n] of Object.entries(pide?.materiales || {})) ctx.sumarMaterial(k, -n);
    for (const [k, n] of Object.entries(pide?.cuenta || {})) {
      p.cosas[k] = Math.max(0, (p.cosas[k] || 0) - n);
      if (!p.cosas[k]) delete p.cosas[k];
    }
    if (pide?.ramitas) p.ramitas = Math.max(0, (p.ramitas || 0) - pide.ramitas);
  }

  function pasarHoras(n) {
    const p = ctx.progreso();
    p.horas += n;
    while (p.horas >= 24) { p.horas -= 24; p.dia++; ctx.nota(`Día ${p.dia}`, 'Se te fue el día en eso'); }
  }

  // El viento voltea una pieza liviana que esté afuera: se recupera la mitad, como al desmontar.
  function voltear() {
    const obras = ctx.obras();
    if (!obras?.obras) return null;
    const candidatas = obras.obras.filter((o) => LIVIANAS.includes(o.plano.id) && o.datos.etapas >= o.plano.etapas.length && !o.plano.soportaPiezas);
    const afuera = candidatas.filter((o) => {
      const y = Number.isFinite(o.datos.y) ? o.datos.y : (ctx.altura?.(o.datos.x, o.datos.z) || 0);
      try { return !obras.bajoCubierta?.({ x: o.datos.x, y: y + 1, z: o.datos.z }); } catch { return true; }
    });
    if (!afuera.length) return null;
    const o = afuera[ev().semilla % afuera.length];
    const nombre = o.plano.nombre;
    const caidas = obras.destruir(o);
    const recupera = {};
    for (const c of caidas) for (let i = 0; i < Math.min(c.datos.etapas, c.plano.etapas.length); i++) {
      for (const [k, n] of Object.entries(c.plano.etapas[i].pide || {})) recupera[k] = (recupera[k] || 0) + Math.max(1, Math.floor(n * 0.5));
    }
    for (const [k, n] of Object.entries(recupera)) ctx.sumarMaterial(k, n);
    ctx.sincronizarObras();
    return { nombre, recupera };
  }

  // Aplica los efectos de una opción o de un "después". Devuelve las líneas para la nota.
  function aplicar(efectos) {
    const p = ctx.progreso();
    const dichos = [];
    for (const f of efectos || []) {
      switch (f.tipo) {
        case 'dar': ctx.cobrar(f.premio); break;
        case 'gratitud':
          if (sumarGratitud(ev(), f.quien, f.n || 1, p.dia)) dichos.push(`${nombreVecinoEvento(f.quien)} no se va a olvidar`);
          else dichos.push(`${nombreVecinoEvento(f.quien)} te lo agradece`);
          break;
        case 'horas': pasarHoras(Math.max(0, Number(f.n) || 0)); break;
        case 'lena': p.humedadLena = f.mojada ? 1 : 0; dichos.push(f.mojada ? 'La leña que llevás se mojó' : 'La leña quedó seca'); break;
        case 'helada': if (!ctx.helarHuerta?.()) dichos.push('Heló, pero no había nada sembrado afuera'); break;
        case 'voltear': {
          const r = voltear();
          if (r) {
            const vuelve = Object.entries(r.recupera).map(([k, n]) => `${n} ${nombreCosa(k, n)}`).join(', ');
            ctx.nota(`El viento volteó: ${r.nombre}`, vuelve ? `Juntaste lo que quedó: ${vuelve}` : 'No quedó nada que sirva', true);
          } else dichos.push('El viento no encontró nada tuyo suelto');
          break;
        }
        case 'cosa':
          if (!p.cosas?.[f.id]) { ctx.cobrar({ cosa: f.id, texto: `Una cosa nueva en la mochila: ${TRUEQUES.find((t) => t.id === f.id)?.nombre || f.id}` }); }
          else if (f.sino) ctx.cobrar(f.sino);
          break;
        case 'visita': {
          // viene a la mesa de verdad (lo trae el sistema de visitas): si no hay mesa, no viene
          const v = p.visitas;
          const hayMesa = !!mesaPuesta(ctx.extra().terminadas || []);
          // 3.5.1: aceptada a la noche, la visita se "terminaba" sola sin que viniera nadie: contaba para el
          // capítulo 8 y trababa la visita de verdad por tres días. Tarde, no viene.
          const temprano = (Number(p.horas) || 0) < VISITA.seVa - 1;
          if (v && !v.activa && hayMesa && temprano && ctx.extra().vecinos !== false && Object.hasOwn(VISITANTES, f.quien)) {
            v.activa = { clave: f.quien, dia: p.dia, charlo: false };
            ctx.nota(`${nombreVecinoEvento(f.quien)} viene a tu mesa`, 'Te espera ahí hasta que caiga la noche', true);
          } else if (!hayMesa) dichos.push(`${nombreVecinoEvento(f.quien)} pasó, pero no tenías mesa puesta`);
          else if (!temprano) dichos.push(`${nombreVecinoEvento(f.quien)} quería pasar, pero ya se hizo tarde`);
          break;
        }
        case 'poblador': {
          // 3.1 (el pueblo): si queda alguien por venir y no hay nadie esperando, viene sin esperar
          const r = p.pueblo ? puedeLlegarPoblador(p, 1) : null;
          if (r?.quien && !p.pueblo.llegando && llamarPoblador(p.pueblo)) dichos.push('Alguien quiere venir a vivir al valle: con una casa libre, llega en el próximo tren');
          break;
        }
        default: break;
      }
    }
    ctx.refrescarBarra();
    return dichos;
  }

  function mostrarEvento(e) {
    const t = tengo();
    tarjetas.mostrar({
      clase: 'evento', arriba: 'Pasa algo en el valle', titulo: e.titulo, texto: [e.texto],
      opciones: e.opciones.map((o) => {
        const falta = faltaPara(o.pide, t);
        return { id: o.id, texto: o.texto, detalle: falta.length ? `Te falta: ${falta.join(', ')}` : o.detalle, deshabilitada: falta.length > 0 };
      }),
      alElegir: (id) => elegir(id),
    });
  }
  function elegir(id) {
    const p = ctx.progreso();
    const r = elegirOpcion(ev(), id, p.dia, tengo());
    if (!r) { tarjetas.cerrar(); return true; }
    if (!r.ok) { ctx.nota('No te alcanza', r.falta.join(', ')); return false; }
    cobrar(r.pide);
    const dichos = aplicar(r.efectos);
    if (r.diario) ctx.diario('evento', r.diario);
    tarjetas.cerrar();
    const hayDespues = (r.opcion.luego || []).length > 0;
    ctx.nota(r.evento.titulo, [...dichos, hayDespues ? 'Ya se verá qué pasa' : ''].filter(Boolean).join(' · ') || 'Decidido');
    ctx.sonido?.()?.anotar?.();
    ctx.guardar();
    return true;
  }

  function mostrarSeguimiento(s) {
    tarjetas.mostrar({
      clase: 'despues', arriba: 'Lo que pasó después', titulo: s.seguimiento.titulo, texto: [s.seguimiento.texto],
      opciones: [{ id: 'seguir', texto: 'Seguir', detalle: '' }],
      alElegir: () => {
        const p = ctx.progreso();
        const r = cerrarSeguimiento(ev(), s.id, p.dia, { vecinos: ctx.extra().vecinos !== false });   // 3.5.1
        tarjetas.cerrar();
        if (r) {
          const dichos = aplicar(r.efectos);
          ctx.diario('evento', `${r.seguimiento.titulo}. ${r.seguimiento.texto.split('. ')[0]}.`);
          if (dichos.length) ctx.nota(r.seguimiento.titulo, dichos.join(' · '));
        }
        ctx.guardar();
        return true;
      },
    });
  }

  // Una vez por revisión (con el juego andando y nada abierto). Devuelve true si mostró algo.
  function revisar({ puedeAzar = true } = {}) {
    const e = ev();
    const s = estado();
    if (e.activo) {
      const def = EVENTO_VALLE[e.activo.id];
      if (def) { mostrarEvento(def); return true; }
      e.activo = null;
    }
    const listo = seguimientoListo(e, s);
    if (listo) { mostrarSeguimiento({ id: listo.id, seguimiento: SEGUIMIENTOS[listo.id] }); return true; }
    if (!puedeAzar) return false;
    const nuevo = revisarEventos(e, s);
    if (nuevo) { ctx.guardar(); mostrarEvento(nuevo); return true; }
    return false;
  }
  // la historia pide un evento puntual (un momento de un capítulo)
  function forzar(id, desde = 'historia') {
    const p = ctx.progreso();
    const r = forzarEvento(ev(), id, p.dia, desde);
    if (r) ctx.guardar();
    return !!r;
  }
  return { ev, estado, revisar, forzar, elegir, aplicar, voltear };
}
