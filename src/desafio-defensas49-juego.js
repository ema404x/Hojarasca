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

export function crearDefensas49(T, escena, camara, col, obras, efectos, sonido, api) {
  const trampas = crearTrampasMundo(T, escena, obras, efectos, sonido, api);
  const pasadizo = crearPasadizoMundo(T, col, obras, sonido, api);

  // Cada cuadro. `noche` va de 0 a 1.
  function actualizar(dt, js, noche) {
    trampas.actualizar(dt);
    pasadizo.actualizar(dt);
  }
  // Lo que le pasa a cada duende antes de moverse: { quieto, vel, sinAtaque, rumbo } (rumbo nulo si no lo cambia).
  const SAL = { quieto: false, vel: 1, sinAtaque: false, rumbo: null };
  function estadoAlien(a, dt, js) {
    SAL.quieto = false; SAL.vel = 1; SAL.sinAtaque = false; SAL.rumbo = null;
    const m = trampas.estadoAlien(a, dt, js);
    if (m.quieto) SAL.quieto = true;
    if (m.sinAtaque) SAL.sinAtaque = true;
    return SAL;
  }
  const limpiarAlien = (a) => { trampas.limpiarAlien(a); };
  // La E y su aviso (junto a una trampa, una boca del pasadizo…): el aviso o nulo / verdadero si hizo algo
  const avisoCerca = (pos) => pasadizo.avisoCerca(pos) || trampas.avisoCerca(pos);
  const usarCerca = (pos) => pasadizo.usarCerca(pos) || trampas.usarCerca(pos);
  function limpiar() { trampas.limpiar(); pasadizo.limpiar(); }
  return {
    actualizar, estadoAlien, limpiarAlien, avisoCerca, usarCerca, limpiar,
    trampas, pasadizo,
    colocarTrampaMiel: (x, z, opciones) => trampas.colocar(x, z, opciones),
  };
}
