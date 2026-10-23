// 4.9 defensas: el enganche de «La aldea en la noche, tanda defensas» con el Desafío. desafio.js arma esto una vez con la misma
// `api` que las defensas y el fortín, y lo llama en pocos lugares (cada cuadro, en cada duende, con la E y al reciclar un duende).
//
//   · lo roto que se ve        → desafio-roto-mundo.js
//   · la trampa de miel        → desafio-trampas-mundo.js
//   · el pasadizo de escape    → desafio-pasadizo-mundo.js
//   · el farol de mano         → desafio-farol-mundo.js
//   · la pala de brasas        → desafio-brasas-mundo.js
import { crearTrampasMundo } from './desafio-trampas-mundo.js';
import { crearPasadizoMundo } from './desafio-pasadizo-mundo.js';
import { crearRotoMundo } from './desafio-roto-mundo.js';
import { crearFarolMundo } from './desafio-farol-mundo.js';
import { crearBrasasMundo } from './desafio-brasas-mundo.js';
import { sanearBrasas } from './desafio-brasas.js';

export function crearDefensas49(T, escena, camara, col, obras, efectos, sonido, api, defensas = null) {
  const trampas = crearTrampasMundo(T, escena, obras, efectos, sonido, api);
  const pasadizo = crearPasadizoMundo(T, col, obras, sonido, api);
  const roto = crearRotoMundo(obras);
  const farol = crearFarolMundo(camara, api);
  const brasas = crearBrasasMundo(T, efectos, sonido, api, trampas, defensas);
  let preparado = false;

  // Cada cuadro. `noche` va de 0 a 1.
  function actualizar(dt, js, noche) {
    if (!preparado) { preparado = true; brasas.preparar(); sanearBrasas(api.D()); }   // los sonidos de la pala se hacen una vez, en la cola del motor
    trampas.actualizar(dt);
    pasadizo.actualizar(dt);
    roto.actualizar(dt);
    farol.actualizar(dt, js);
    brasas.actualizar(dt);
  }
  // Lo que le pasa a cada duende antes de moverse: { quieto, vel, sinAtaque, rumbo } (rumbo nulo si no lo cambia). Primero lo
  // más fuerte: pegado en la miel; después las brasas (dudan y retroceden); después el farol (los viejos oscuros se alejan).
  const SAL = { quieto: false, vel: 1, sinAtaque: false, rumbo: null };
  function estadoAlien(a, dt, js) {
    SAL.quieto = false; SAL.vel = 1; SAL.sinAtaque = false; SAL.rumbo = null;
    const m = trampas.estadoAlien(a, dt, js);
    if (m.quieto) { SAL.quieto = true; SAL.sinAtaque = true; return SAL; }
    const b = brasas.estadoAlien(a, dt, js);
    if (b) { SAL.sinAtaque = true; SAL.vel *= b.vel; if (b.rumbo !== null) SAL.rumbo = b.rumbo; }
    const f = farol.estadoAlien(a, js);
    if (f) { SAL.sinAtaque = true; SAL.vel *= f.vel; if (SAL.rumbo === null) SAL.rumbo = f.rumbo; }
    return SAL;
  }
  const limpiarAlien = (a) => { trampas.limpiarAlien(a); brasas.limpiarAlien(a); };
  // La E y su aviso (junto a una trampa, una boca del pasadizo, un fuego con la pala en la mano…): el aviso o nulo / verdadero si hizo algo
  const avisoCerca = (pos) => pasadizo.avisoCerca(pos) || trampas.avisoCerca(pos) || brasas.avisoCerca(pos);
  const usarCerca = (pos) => pasadizo.usarCerca(pos) || trampas.usarCerca(pos) || brasas.usarCerca(pos);
  function limpiar() { trampas.limpiar(); pasadizo.limpiar(); roto.limpiar(); farol.limpiar(); brasas.limpiar(); }
  return {
    actualizar, estadoAlien, limpiarAlien, avisoCerca, usarCerca, limpiar,
    trampas, pasadizo, roto, farol, brasas,
    colocarTrampaMiel: (x, z, opciones) => trampas.colocar(x, z, opciones),
    abanico: (js, dir) => brasas.abanico(js, dir),
    alternarFarol: () => farol.alternar(),
    get farolPrendido() { return farol.prendido; },
    alcanceDelata: (alcance) => farol.alcance(alcance),
    fuegosDeBase: () => brasas.fuegosDeBase(),
  };
}
