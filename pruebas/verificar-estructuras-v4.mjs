import fs from 'node:fs';
import assert from 'node:assert/strict';
import { crearColisiones } from '../src/colisiones.js';

const leer = (ruta) => fs.readFileSync(new URL(`../${ruta}`, import.meta.url), 'utf8');
const jugador = leer('src/jugador.js');
const puertas = leer('src/puertas.js');
const piezas = leer('src/piezas.js');
const colisiones = leer('src/colisiones.js');

// 1) La colisión vertical usa el cuerpo completo, no solo la altura de los pies.
{
  const c = crearColisiones();
  c.agregar({ seg: true, ax: -2, az: 0, bx: 2, bz: 0, r: 0.10, alturaMin: 0.80, alturaMax: 0.95 });
  const dePie = { x: 0, y: 0, z: 0 };
  c.resolver(dePie, 0.35, 1.65);
  assert.ok(Math.hypot(dePie.x, dePie.z) > 0.44, 'un obstáculo a la altura del torso se atraviesa estando de pie');

  const agachadoBajo = { x: 0, y: 0, z: 0 };
  c.resolver(agachadoBajo, 0.35, 0.60);
  assert.equal(agachadoBajo.x, 0, 'un cuerpo que cabe completamente debajo de un obstáculo elevado fue empujado');
  assert.equal(agachadoBajo.z, 0, 'un cuerpo que cabe completamente debajo de un obstáculo elevado fue empujado');
}

// 2) El jugador comunica al motor su altura real de pie/agachado.
// (1.10: a caballo el cuerpo es más alto y más ancho; a pie sigue siendo 0.35 de radio
// y la altura de pie o agachado.)
assert.ok(
  /const alturaFisica = (estado\.montado \? [^:]+ : )?estado\.agachado \? ALTURA_AGACHADO : ALTURA_OJOS;/.test(jugador)
    && /const radioFisico = estado\.montado \? 0\.6 : 0\.35;/.test(jugador)
    && jugador.includes('col.resolver(estado.pos, radioFisico, alturaFisica);'),
  'jugador volvió a resolver colisiones sin altura corporal'
);

// 3) La colisión de las puertas debe seguir la hoja real durante la animación.
assert.ok(puertas.includes('const ang = puerta.g.rotation.y;'),
  'la puerta batiente dejó de actualizar la orientación de su colisión');
assert.ok(puertas.includes('puerta.col.bx = puerta.g.position.x + Math.cos(ang) * largo;'),
  'la colisión de la hoja batiente ya no sigue su extremo libre');
assert.ok(puertas.includes('const desplazamiento = puerta.lado * puerta.abierta * (puerta.ancho * 0.98);'),
  'el portón corredizo dejó de desplazar su colisión con la hoja');
assert.ok(!puertas.includes('puerta.col.alturaMax = -999'),
  'una puerta vuelve a hacerse atravesable durante la animación');

// 4) Los muebles bajos marcados como pisables no quedan encerrados por un zócalo invisible.
assert.ok(piezas.includes('const escalable = pisable && (tope - oy) <= 0.68;'),
  'falta clasificación de muebles bajos pisables');
assert.ok(piezas.includes('if (!escalable) for (const [a1, b1, a2, b2] of lados)'),
  'un mueble pisable bajo volvió a tener cuatro paredes invisibles');
assert.ok(piezas.includes('escalonMax: escalable ? 0.70 : 0.60'),
  'la plataforma de mueble bajo no conserva una altura de paso alcanzable');
assert.ok(colisiones.includes('const pasoPropio = p.escalonMax !== undefined ? p.escalonMax : 0.6;'),
  'el motor de plataformas ignora la altura de paso específica');

console.log('OK auditoría estructural v4');
