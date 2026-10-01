import fs from 'node:fs';
import assert from 'node:assert/strict';
import { crearColisiones } from '../src/colisiones.js';

const leer = (ruta) => fs.readFileSync(new URL(`../${ruta}`, import.meta.url), 'utf8');
const jugador = leer('src/jugador.js');
const piezas = leer('src/piezas.js');
const estructuras = leer('src/estructuras.js');
const puertas = leer('src/puertas.js');

// 1) Un piso por encima no puede capturar a un jugador en el aire.
{
  const c = crearColisiones();
  c.agregarPlataforma({ x: 0, z: 0, largo: 4, ancho: 4, ang: 0, alto: 2, espesor: 0.2 });
  assert.equal(c.plataformaEn(0, 0, 1.55, 0.015), null,
    'una plataforma superior captura al jugador durante un salto');
  assert.equal(c.plataformaEn(0, 0, 1.55, 0.6)?.alto, 2,
    'el step-up controlado dejó de permitir una subida válida');
}

// 2) La cara inferior de una plataforma detiene la cabeza al subir.
{
  const c = crearColisiones();
  c.agregarPlataforma({ x: 0, z: 0, largo: 4, ancho: 4, ang: 0, alto: 2.2, espesor: 0.2 });
  const hit = c.techoEntre(0, 0, 1.8, 2.15);
  assert.ok(hit, 'no se detectó el intradós de un piso durante el salto');
  assert.ok(Math.abs(hit.abajo - 2.0) < 1e-6, 'el intradós no coincide con el espesor real del piso');
}

// 3) La cabeza tiene radio: rozar el borde de una losa también cuenta.
{
  const c = crearColisiones();
  c.agregarPlataforma({ x: 0, z: 0, largo: 2, ancho: 2, ang: 0, alto: 2.0, espesor: 0.2 });
  const hit = c.techoEntre(1.22, 0, 1.5, 1.95, 0.35);
  assert.ok(hit, 'el cuerpo puede recortar el borde de una losa porque el techo sólo mira el centro');
}

// 3) No se puede ponerse de pie donde el cuerpo no cabe.
{
  const c = crearColisiones();
  c.agregarPlataforma({ x: 0, z: 0, largo: 3, ancho: 3, ang: 0, alto: 1.45, espesor: 0.15 });
  assert.equal(c.espacioVerticalLibre(0, 0, 0, 1.65), false,
    'se permite ponerse de pie atravesando un piso bajo');
  assert.equal(c.espacioVerticalLibre(0, 0, 0, 1.05), true,
    'se impide agacharse aunque el cuerpo sí cabe');
}


// 4) El canto lateral de un piso alto también es sólido, sin bloquear escalones bajos.
{
  const c = crearColisiones();
  c.agregarPlataforma({ x: 0, z: 0, largo: 4, ancho: 4, ang: 0, alto: 1.25, espesor: 0.2 });
  const p = { x: 2.15, y: 0, z: 0 };
  c.resolverPlataformas(p, 0.35, 1.65, 0.62);
  assert.ok(p.x > 2.34, 'se puede atravesar lateralmente el canto de un entrepiso alto');

  const c2 = crearColisiones();
  c2.agregarPlataforma({ x: 0, z: 0, largo: 4, ancho: 4, ang: 0, alto: 0.35, espesor: 0.15 });
  const q = { x: 2.15, y: 0, z: 0 };
  c2.resolverPlataformas(q, 0.35, 1.65, 0.62);
  assert.equal(q.x, 2.15, 'un escalón bajo empezó a comportarse como pared lateral');
}

// 5) Los huecos angulares de pisos circulares siguen siendo atravesables.
{
  const c = crearColisiones();
  c.agregarPlataforma({
    x: 0, z: 0, radio: 3, radioInterior: 1.5, alto: 1.2, espesor: 0.2,
    huecoCentro: 0, huecoMedio: 0.35, huecoDesde: 1.5
  });
  // ángulo 0 en la convención del motor = hacia -Z
  const p = { x: 0, y: 0, z: -2.9 };
  c.resolverPlataformas(p, 0.25, 1.65, 0.62);
  assert.ok(Math.abs(p.x) < 1e-9 && Math.abs(p.z + 2.9) < 1e-9,
    'el hueco angular de una plataforma circular recibió una pared invisible');
}


// 6) Un obstáculo dinámico debe chocar en su posición ACTUAL aunque haya
// cruzado a otra celda espacial desde que se registró.
{
  const c = crearColisiones();
  const puerta = { seg: true, dinamico: true, ax: 0, az: 0, bx: 2, bz: 0, r: 0.12, alturaMin: -0.1, alturaMax: 2.2 };
  c.agregar(puerta);
  puerta.ax = 12; puerta.bx = 14; puerta.az = 0; puerta.bz = 0;
  const p = { x: 13, y: 0, z: 0.05 };
  c.resolver(p, 0.35, 1.65);
  assert.ok(Math.abs(p.z) > 0.46, 'una puerta dinámica dejó de colisionar al cruzar de celda');
  const viejo = { x: 1, y: 0, z: 0.05 };
  c.resolver(viejo, 0.35, 1.65);
  assert.ok(Math.abs(viejo.z - 0.05) < 1e-9, 'la puerta dinámica dejó una colisión fantasma en su celda de origen');
}

// 7) Las piezas deben comunicar el espesor real al motor físico.
assert.ok(piezas.includes('alto: oy + alto + espesor / 2, espesor'),
  'pisos/escalones dejaron de registrar su espesor real');
assert.ok(piezas.includes('alto: tope, espesor: alto'),
  'muebles pisables dejaron de registrar su intradós');

// 8) El jugador usa límites distintos para step-up y movimiento aéreo,
// y bloquea el intento de ponerse de pie sin espacio.
// 3.0.1: también durante el `coyote` (un instante después de perder el piso), nunca subiendo
assert.ok(jugador.includes('const subidaPermitida = (estado.enSuelo || estado.coyote > 0) && estado.vy <= 0 ? 0.62 : 0.015;'),
  'el jugador volvió a permitir step-up completo mientras está en el aire');
assert.ok(jugador.includes('col.resolverPlataformas('), 'el jugador dejó de resolver los cantos laterales de plataformas');
assert.ok(jugador.includes('col.techoEntre('), 'el salto volvió a ignorar la cara inferior de los pisos');
assert.ok(jugador.includes('col.espacioVerticalLibre('), 'el jugador dejó de validar el espacio al ponerse de pie');


// 9) Las puertas móviles no quedan ancladas a una celda espacial vieja.
assert.ok(puertas.includes('dinamico: true'), 'las puertas dejaron de registrarse como colisiones dinámicas');
assert.ok(puertas.includes('La colisión está registrada como dinámica'), 'se perdió la sincronización espacial documentada de puertas');

// 10) El faro tiene una salida física real a la galería y sus muebles grandes ocupan lugar.
assert.ok(estructuras.includes('const HUECO_GALERIA'), 'la pared alta del faro volvió a cerrar la salida a la galería');
// 3.0.1: la mesa se mudó al lado sano del piso (el hueco de la escalera creció): su posición es mesaFx/mesaFz
assert.ok(estructuras.includes('P.mueble({ lx: mesaFx, ly: ALTO - 0.35, lz: mesaFz'), 'la mesa del farero volvió a ser atravesable');

// 11) La maquinaria mayor del molino también participa en la física.
assert.ok(estructuras.includes('alturaMin: sitio.y + 3.12, alturaMax: sitio.y + 3.86'),
  'las muelas del molino volvieron a ser decorado atravesable');

console.log('OK auditoría estructural v5');
