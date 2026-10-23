// 4.9 defensas: el farol de mano en el mundo (las reglas y los números están en desafio-farol.js).
//
//   · El farol que se ve en la mano izquierda (pegado a la cámara) mientras está prendido: marco, vidrio ámbar y llama, con un
//     leve vaivén al caminar. Los materiales son los de siempre (Lambert y Basic): no se compila ningún shader nuevo.
//   · La luz: no hay luces nuevas. Prendido, la linterna (la luz que va pegada a la cámara) toma el color ámbar, un ángulo ancho,
//     poco alcance y se corre a la izquierda; al apagarlo vuelve a como estaba. Mientras el farol esté prendido, la L no la apaga.
//   · Los viejos oscuros retroceden dentro del radio del farol; los tiradores te ven de más lejos (`delata`).
//   · Se apaga con la lluvia fuerte.
import * as THREE from 'three';
import { FAROL, efectoFarol, rumboAlejarse, alcanceDelata, sePuedePrender, brilloFarol } from './desafio-farol.js';

export function crearFarolMundo(camara, api) {
  // ---------------------------------------------------------------- el farol en la mano izquierda
  const lam = (c) => new THREE.MeshLambertMaterial({ color: c });
  const matMarco = lam('#3a3430'), matAro = lam('#6b5238');
  const matVidrio = new THREE.MeshBasicMaterial({ color: 0xc88a2e, transparent: true, opacity: 0.42, depthWrite: false });
  const matLlama = new THREE.MeshBasicMaterial({ color: 0xffd27a });
  const mano = new THREE.Group();
  mano.position.set(-0.3, -0.29, -0.5);
  mano.visible = false;
  const cuerpo = new THREE.Group();
  mano.add(cuerpo);
  { // marco: base, cuatro postes, tapa y el aro del que se agarra
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.05, 0.016, 8), matMarco); base.position.y = 0;
    const tapa = new THREE.Mesh(new THREE.ConeGeometry(0.056, 0.05, 8), matMarco); tapa.position.y = 0.165;
    const aro = new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.005, 5, 12), matAro); aro.position.y = 0.215; aro.rotation.x = 0.35;
    const vidrio = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.043, 0.13, 8, 1, true), matVidrio); vidrio.position.y = 0.085;
    const llama = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 5), matLlama); llama.position.y = 0.07; llama.scale.set(1, 1.5, 1);
    cuerpo.add(base, tapa, aro, vidrio, llama);
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + Math.PI / 4;
      const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.15, 4), matMarco);
      poste.position.set(Math.cos(a) * 0.043, 0.085, Math.sin(a) * 0.043);
      cuerpo.add(poste);
    }
    cuerpo.userData.llama = llama;
  }
  camara.add(mano);

  // ---------------------------------------------------------------- la luz (la de la linterna, prestada)
  let guardada = null;
  function tomarLuz(luz) {
    if (guardada) return;
    guardada = { color: luz.color.getHex(), distance: luz.distance, angle: luz.angle, penumbra: luz.penumbra, decay: luz.decay,
      x: luz.position.x, y: luz.position.y, z: luz.position.z, intensity: luz.intensity, ty: luz.target.position.y, tz: luz.target.position.z };
  }
  function devolverLuz(luz) {
    if (!guardada || !luz) { guardada = null; return; }
    luz.color.setHex(guardada.color); luz.distance = guardada.distance; luz.angle = guardada.angle; luz.penumbra = guardada.penumbra;
    luz.decay = guardada.decay; luz.position.set(guardada.x, guardada.y, guardada.z); luz.target.position.set(0, guardada.ty, guardada.tz);
    luz.intensity = 0;   // al apagar el farol, la linterna queda apagada (la L la prende como siempre)
    guardada = null;
  }
  function ponerLuz(luz, t) {
    const F = FAROL.luz;
    luz.color.setHex(F.color); luz.distance = F.alcance; luz.angle = F.angulo; luz.penumbra = F.penumbra; luz.decay = F.decaimiento;
    luz.position.set(F.x, F.y, F.z); luz.target.position.set(0, -2.2, -3.6);   // mira un poco hacia abajo: alumbra el suelo de alrededor
    luz.intensity = F.intensidad * brilloFarol(t);
  }

  // ---------------------------------------------------------------- prendido y apagado
  let activo = false, t = 0;
  const quiere = () => { const d = api.D(); return !!d.farolOn && !!api.cosas().farolMano; };
  // El botón de la barra: prende o apaga. Devuelve el estado nuevo, o null si no se pudo.
  function alternar() {
    const d = api.D();
    if (d.farolOn) { d.farolOn = false; api.nota('Apagaste el farol', ''); api.sonido?.carrete?.(); return false; }
    const r = sePuedePrender({ lluvia: api.clima().lluvia, tiene: !!api.cosas().farolMano });
    if (!r.ok) { api.nota(r.motivo, r.sub); return null; }
    d.farolOn = true;
    api.nota('Prendiste el farol', 'Los viejos oscuros no se te acercan, pero te ven de lejos');
    api.sonido?.encender?.();
    return true;
  }
  function actualizar(dt, js) {
    t += dt;
    const luz = api.luzLinterna?.();
    const d = api.D();
    // la lluvia fuerte lo apaga
    if (d.farolOn && api.clima().lluvia > FAROL.lluvia) { d.farolOn = false; api.nota('La lluvia apagó el farol', 'Cuando afloje, prendelo de nuevo'); }
    const q = quiere();
    if (q !== activo) {
      activo = q;
      mano.visible = q;
      if (luz) { if (q) tomarLuz(luz); else devolverLuz(luz); }
    }
    if (!activo) return;
    if (luz) { if (!guardada) tomarLuz(luz); ponerLuz(luz, t); }
    // el vaivén al caminar y el titileo de la llama
    const v = Math.min(1, Math.hypot(js.vel?.x || 0, js.vel?.z || 0) / 5);
    cuerpo.position.y = Math.sin(t * 1.3) * 0.004 + Math.abs(Math.sin(t * 7.5)) * 0.012 * v;
    cuerpo.rotation.z = Math.sin(t * 1.1) * 0.03 + Math.sin(t * 3.7) * 0.02 * v;
    cuerpo.userData.llama.scale.set(1, 1.35 + Math.sin(t * 17) * 0.2, 1);
  }

  // ---------------------------------------------------------------- los duendes
  const SAL = { rumbo: null, vel: 1, sinAtaque: false };
  // Qué hace el farol con este duende. Devuelve { rumbo, vel, sinAtaque } o null.
  function estadoAlien(a, js) {
    if (!activo) return null;
    const p = a.m.g.position, dist = Math.hypot(js.pos.x - p.x, js.pos.z - p.z);
    const e = efectoFarol({ dist, viejo: !!a.m.viejo?.(), def: a.def, romper: a.estado === 'romper' });
    if (!e) return null;
    SAL.rumbo = rumboAlejarse(p, js.pos); SAL.vel = e.vel; SAL.sinAtaque = true;
    return SAL;
  }
  // El multiplicador del alcance de los tiradores (1 con el farol apagado).
  const alcance = (alc) => alcanceDelata(alc, activo);

  function limpiar() {
    const luz = api.luzLinterna?.();
    if (activo && luz) devolverLuz(luz);
    activo = false; mano.visible = false;
  }
  return { actualizar, alternar, estadoAlien, alcance, limpiar, get prendido() { return activo; }, mano };
}
