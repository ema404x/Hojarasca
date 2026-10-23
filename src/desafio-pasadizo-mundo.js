// 4.9 defensas: el pasadizo de escape en el mundo (las reglas y los números están en desafio-pasadizo.js; la pieza, con su tapa y su
// tronco hueco, en planos-defensas-49.js).
//
// Con E junto a una boca bajás y salís por la otra: la pantalla se cierra en un negro de tierra, el cuerpo cambia de lugar con
// el negro cerrado y se abre del otro lado, mirando hacia afuera de la boca y en un lugar libre (el primero de los que prueba
// `salidasDe` donde no haya nada: ni paredes, ni árboles, ni agua). Los duendes no lo usan ni lo ven: la obra es `sinCuerpo` y
// `oculta` (ni pared, ni blanco, ni defensa que cuente), y nadie la sigue por ahí. Sólo teclado y ratón.
import { hayLugar } from './despertar.js';
import { PASADIZO, bocaDe, otraBoca, bocaCerca, salidasDe, avisoPasadizo, faseDeBajada } from './desafio-pasadizo.js';

export function crearPasadizoMundo(T, col, obras, sonido, api) {
  const completa = (o) => o.datos.etapas >= o.plano.etapas.length && o !== obras.editando;
  let lista = [], acum = 9;
  function refrescar() {
    lista = [];
    for (const o of obras.obras) if (o.plano.defensa?.tipo === 'pasadizo' && completa(o)) lista.push(o);
  }

  // ---------------------------------------------------------------- el negro de la pantalla
  let velo = null;
  function ponerVelo(k) {
    if (!velo) {
      if (k <= 0) return;
      velo = document.createElement('div');
      velo.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:5;opacity:0;background:radial-gradient(ellipse at center,#14100b 0%,#070504 70%,#000 100%);display:none';
      document.body.appendChild(velo);
    }
    velo.style.display = k > 0.002 ? 'block' : 'none';
    velo.style.opacity = String(Math.min(1, k));
  }

  // ---------------------------------------------------------------- dónde está cada boca
  function cercaDe(pos) {
    for (const o of lista) {
      if (Math.abs((o.datos.y ?? pos.y) - pos.y) > 3.5) continue;
      const cual = bocaCerca(o.datos, pos);
      if (cual) return { obra: o, cual };
    }
    return null;
  }
  // El primer lugar de salida con lugar de pie, sin agua. Si ninguno sirve, el último probado más lejos.
  function lugarDeSalida(obra, cual) {
    for (const extra of [0, 0.8, 1.6]) {
      for (const s of salidasDe(obra.datos, cual)) {
        const b = bocaDe(obra.datos, cual), d = Math.hypot(s.x - b.x, s.z - b.z) || 1;
        const x = b.x + (s.x - b.x) / d * (d + extra), z = b.z + (s.z - b.z) / d * (d + extra);
        if (T.agua(x, z)) continue;
        if (hayLugar(col, x, z, T.altura(x, z))) return { x, z, yaw: s.yaw };
      }
    }
    return null;
  }

  // ---------------------------------------------------------------- bajar y salir
  let anim = null, enfria = 0;
  function empezar(hit) {
    const hacia = otraBoca(hit.cual), llega = lugarDeSalida(hit.obra, hacia);
    if (!llega) { api.nota('La otra boca está tapada', 'Hay algo encima: mirá que no la hayas cerrado con una obra o un árbol'); return; }
    const js = api.jugador().estado;
    anim = { t: 0, hecho: false, hit, llega, desde: { x: js.pos.x, z: js.pos.z } };
    enfria = PASADIZO.enfria + PASADIZO.baja + PASADIZO.sube;
    api.invulnerable?.(PASADIZO.baja + PASADIZO.sube + PASADIZO.protege);
    sonido.golpeRuido?.({ dur: 0.45, frec: 260, q: 1.4, tipo: 'lowpass', vol: 0.35, destino: sonido.fuente?.(js.pos, 1) });
    sonido.golpeRuido?.({ dur: 0.25, frec: 1500, q: 2, vol: 0.08, cuando: 0.1, destino: sonido.fuente?.(js.pos, 1) });
  }
  function actualizar(dt) {
    acum += dt;
    if (acum > 1) { acum = 0; refrescar(); }
    enfria = Math.max(0, enfria - dt);
    if (!anim) return;
    anim.t += dt;
    const f = faseDeBajada(anim.t), j = api.jugador(), js = j.estado;
    ponerVelo(f.negro);
    if (!anim.hecho && anim.t >= PASADIZO.baja) {
      anim.hecho = true;
      j.ubicar(anim.llega.x, anim.llega.z, anim.llega.yaw);
      j.desencajar?.();
      sonido.golpeRuido?.({ dur: 0.4, frec: 320, q: 1.2, tipo: 'lowpass', vol: 0.3, destino: sonido.fuente?.(js.pos, 1) });
    }
    // quieto mientras dura: antes de la mitad en la boca, después en el lugar donde sale
    const p = anim.hecho ? anim.llega : anim.desde;
    js.pos.x = p.x; js.pos.z = p.z; js.vel.set(0, 0, 0);
    if (f.parte === 'fin') { anim = null; ponerVelo(0); }
  }

  // ---------------------------------------------------------------- E
  function avisoCerca(pos) {
    if (anim) return null;
    const hit = cercaDe(pos);
    return hit ? avisoPasadizo(hit.cual) : null;
  }
  function usarCerca(pos) {
    const hit = cercaDe(pos);
    if (!hit) return false;
    if (anim || enfria > 0) return true;   // ya está bajando: la E no se pasa a otra cosa
    empezar(hit);
    return true;
  }
  function limpiar() { anim = null; ponerVelo(0); }
  return {
    actualizar, refrescar, avisoCerca, usarCerca, limpiar, lugarDeSalida,
    get pasadizos() { return lista; },
    get usando() { return !!anim; },
  };
}
