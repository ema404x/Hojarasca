// 4.0.1 · Núcleo del juego (zona D): caer en el Desafío sobre un vehículo, la fauna en pausa, el escudo con mando, la victoria con el cuaderno abierto,
// el banco de pruebas, el espejo de Bruno y la catapulta. Lo que se puede probar sin el mundo 3D se prueba andando; el resto, en el texto de main.js.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const main = leer('src/main.js');
const { crearKayak } = await import('../src/kayak.js');

// 1) caer sobre el kayak: te baja (la prueba anda el kayak de verdad)
{
  const escena = { add() {}, remove() {} }, camara = { add() {} };
  const T = { lugares: { muelle: { x: 0, z: 0, ang: 0 } }, altura: () => 0, agua: () => ({ prof: 3, nivel: 0 }) };
  const k = crearKayak(T, escena, camara, { agregar() {} }, null);
  const jugador = { estado: { enKayak: true, enVela: false }, ubicar() {} };
  k.est.activo = true; k.est.vel = 2; k.remo.visible = true;
  k.soltar(jugador);
  assert.equal(jugador.estado.enKayak, false, 'el jugador deja de estar en el kayak');
  assert.equal(k.est.activo, false, 'el kayak queda quieto');
  assert.equal(k.est.vel, 0);
  assert.equal(k.remo.visible, false, 'y el remo en la mano se guarda');
}
assert.match(main, /if \(js\.enVela\) vela\.soltar\(jugador\); if \(js\.enKayak\) kayak\.soltar\(jugador\); if \(js\.enTren\) tren\.soltar\(jugador\);/, 'caerEnDesafio baja del velero, el kayak y la trochita antes de guardar');
const tiene = (texto, trozo, que) => assert.ok(texto.includes(trozo), que);
const fortin = leer('src/desafio-fortin-mundo.js'), defensas = leer('src/desafio-defensas.js');

// 2) la fauna no junta el tiempo de la pausa
tiene(main, "acumuladoFauna = (modo === 'jugando' || modo === 'inicio') ? acumuladoFauna + dt : 0;", 'fauna: sólo acumula jugando');
assert.ok(!/^\s*acumuladoFauna \+= dt;/m.test(main), 'fauna: no queda el acumulador sin condición');

// 3) el escudo se suelta con L2 también en la pausa y con los planos abiertos
tiene(main, "if (m.soltados.bloquear && desafio?.bloqueando) desafio.bloquear(false);\n  if (desafio && !desafio.caido && !modoObra) {", 'escudo: se suelta antes de mirar el modo de obra');
tiene(main, 'desafio.bloquear(false);   // 4.0.1: soltar L2 en la pausa', 'escudo: y en leerMandoEnMenu');

// 4) la victoria sale aunque abras el cuaderno o el mapa durante los 5 s
tiene(main, "modo === 'valle' || modo === 'cuaderno' || modo === 'mapa') mostrarVictoria", 'victoria: reintenta con el cuaderno o el mapa');

// 5) el banco de pruebas: el informe se cierra al volver al juego y, lanzado desde la portada, se vuelve a la portada
tiene(main, "for (const id of ['pausa', 'cuaderno', 'mapa', 'banco']) $(id).classList.add('oculto');   // (4.0.1", 'banco: volverAlJuego esconde el informe');
tiene(main, "if (g?.modo === 'inicio') { $('hud').classList.add('oculto'); modo = 'inicio'; }", 'banco: desde la portada se vuelve a la portada');
tiene(main, "if (modo !== 'inicio') abrir('pausa');", 'banco: Cerrar no abre la pausa desde la portada');

// 6) el espejo de Bruno: suelta el mouse y las teclas, y soltar el mouse no abre la pausa
tiene(main, "alSoltar: () => { if (modo === 'jugando' && !creadorAbierto) abrir('pausa'); }", 'espejo: el mouse suelto con el creador abierto no abre la pausa');
tiene(main, 'jugador.soltar(); } catch { /* sin bloqueo */ } }\n  jugador.teclas.clear();', 'espejo: suelta el mouse y olvida las teclas');

// 7) la catapulta, la campana y las trampas ignoran a las crías de adentro del Coihue
tiene(fortin, "a.estado !== 'dormido' && !a.enNave;", 'catapulta: las crías de la nave no son blanco');
tiene(defensas, "a.estado === 'bajar' || a.enNave) continue;", 'campana: no suena por las crías');
tiene(defensas, "a.estado === 'irse' || a.enNave) continue;", 'trampa: no hiere a las crías');
console.log('4.0.1 núcleo: ok');
