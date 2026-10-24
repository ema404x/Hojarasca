// 4.10.1: lo que hace determinista a una partida real (Electron): el mismo mundo y los mismos pasos en cualquier PC, con la CPU libre o cargada.
// Las partidas que fallaban «a veces» (humo-3-5-1-desafio, humo-4-9-defensas, humo-4-6-recursos) tenían fuentes de azar que no eran del juego:
//   1. `Math.random`: los vecinos, el perro, los invasores y las noches sin código de partida salen de ahí → se siembra (mulberry32);
//   2. el reloj: `__bucle()` simula `min(0,05 s, tiempo real entre llamadas)`, así que con la PC cargada cada cuadro simulaba menos → se reemplaza
//      `performance.now` por un reloj falso que avanza SOLO 1/60 s por cuadro de la prueba (`window.__cuadro(n)` o `__avanzarReloj()`);
//   3. `requestAnimationFrame` corría solo en paralelo → se congela: el mundo avanza sólo con los cuadros de la prueba;
//   4. los temporizadores del propio juego (sonido, ambiente, caídas de notas) siguen llamando a `Math.random` entre una orden de la prueba y la otra, y eso
//      corría la semilla según el tiempo real → `window.__resembrar()` la vuelve a sembrar (con un contador de pasos) al empezar cada orden importante.
// Uso (en la prueba, después de entrar al juego): `await js(DETERMINISTA(semilla))` y, para correr cuadros, `await js('__cuadros(n)')`.
// No toca el código del juego: todo se hace desde la prueba, en la página.
const DETERMINISTA = (semilla = 12345) => `(() => {
  if (window.__determinista) return 1;
  window.__determinista = true;
  let s = ${Number(semilla) >>> 0} >>> 0;
  Math.random = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  let paso = 0;
  window.__resembrar = () => { s = (${Number(semilla) >>> 0} + (++paso) * 7919) >>> 0; return 1; };
  window.requestAnimationFrame = () => 0;
  let falso = performance.now();
  performance.now = () => falso;
  window.__avanzarReloj = (ms = 1000 / 60) => { falso += ms; return falso; };
  window.__cuadros = (n = 1, ms = 1000 / 60) => { for (let i = 0; i < n; i++) { falso += ms; window.__hojarasca.__bucle(); } return 1; };
  return 1;
})()`;
module.exports = { DETERMINISTA };
