import fs from 'node:fs';
import assert from 'node:assert/strict';

const leer = (ruta) => fs.readFileSync(new URL(`../${ruta}`, import.meta.url), 'utf8');
const estructuras = leer('src/estructuras.js');
const piezas = leer('src/piezas.js');
const puertas = leer('src/puertas.js');
const trochita = leer('src/trochita.js');
const construccion = leer('src/construccion.js');
const colisiones = leer('src/colisiones.js');

// 1) Las paredes curvas visuales deben ser tangentes al mismo arco que usa la física.
assert.ok(
  piezas.includes('matriz([Math.sin(medio) * centroRadio, desde + alto / 2, -Math.cos(medio) * centroRadio], [0, -medio, 0])'),
  'paredCurva volvió a rotar sus cajas con el signo equivocado'
);
assert.ok(!piezas.includes('], [0, medio, 0]),\n            });\n          }\n          // La caja visual'),
  'regresó la orientación radial de paredCurva'
);

// 2) Los huecos circulares visuales y físicos deben abrir hacia afuera desde `desde`.
assert.ok(piezas.includes('const radioVisible = dif < hueco.medio ? desdeHueco : radio;'),
  'el hueco visual de pisoRedondo ya no coincide con el hueco físico');

// 3) Escaleras espirales: el eje largo del peldaño es radial (PI/2 - ángulo).
assert.ok(estructuras.includes('giro: Math.PI / 2 - a2'), 'los peldaños del faro perdieron la orientación radial');
assert.ok(estructuras.includes('ang: -(rot + pe.giro), largo: 1.20'), 'la física de los peldaños del faro no sigue su rotación visual');
assert.ok(estructuras.includes('giro: Math.PI / 2 - e2.a'), 'los peldaños del molino perdieron la orientación radial');

// 4) La escalera frontal de las cabañas debe terminar en el terreno, no enterrada.
assert.ok(estructuras.includes('const sueloPaso = sueloLocal({ x, z, y }, rot, 0, lzPaso);'), 'la escalera de cabaña dejó de consultar el terreno real');
assert.ok(estructuras.includes('const altoPaso = Math.max(ideal, sueloPaso + 0.045);'), 'la escalera de cabaña puede volver a enterrarse bajo el terreno');
assert.ok(!estructuras.includes('alto: 0.14 - i * 0.2'), 'quedó la progresión antigua de escalones bajo tierra');
assert.ok(estructuras.includes('Los pasamanos de la escalinata también frenan'), 'la baranda de la escalera volvió a ser solo visual');

// 5) Los puentes deben tener piso orientado con el tablero y barandas activas al nivel de los pies.
assert.ok(trochita.includes('ang: Math.PI / 2 - ang, largo: luz + 4'), 'el piso físico del puente ferroviario volvió a girarse 90°');
assert.ok(trochita.includes('alturaMin: alto - 0.28, alturaMax: alto + 1.10'), 'la baranda ferroviaria no incluye el nivel del tablero');
assert.ok(estructuras.includes('alturaMin: p.alto - 0.08'), 'la baranda del puente peatonal no incluye el nivel del tablero');

// 6) Puertas elevadas: acotadas hacia abajo, pero desde la base del edificio.
assert.ok(puertas.includes('alturaMin: baseY - 0.16, alturaMax: y + alto'), 'el portón corredizo puede volver a atravesarse desde terreno bajo');
assert.ok(puertas.includes('alturaMin: y - 0.16, alturaMax: puerta.y + alto'), 'la puerta batiente puede volver a atravesarse desde terreno bajo');

// 7) Estaciones/obras elevadas no deben permitir cruzar una pared desde el terreno.
assert.ok(trochita.includes('alturaMin: y - 0.18, alturaMax: y + H + 0.78'), 'las paredes de estación volvieron a empezar por encima de los pies');
assert.ok(construccion.includes('alturaMin: base - 0.16, alturaMax: base + 1.96'), 'la pared del galponcito puede atravesarse desde abajo');
assert.ok(construccion.includes('alturaMin: base - 0.16, alturaMax: base + P.alto + 0.32'), 'las paredes del puesto pueden atravesarse desde abajo');

// 8) La grilla debe usar identidad exacta; el resolver debe reiterar esquinas.
assert.ok(colisiones.includes('const clave = (cx, cz) => `${cx},${cz}`;'), 'regresó un hash espacial con posibles colisiones');
assert.ok(colisiones.includes('const MAX_PASADAS = 10;'), 'el resolvedor dejó de iterar las esquinas');
assert.ok(colisiones.includes('const objetivo = min + 0.001;'), 'falta margen de contacto contra jitter de redondeo');

// 9) Todas las colisiones estructurales explícitas deben estar acotadas verticalmente.
// Los objetos de estos archivos no usan objetos anidados dentro de col.agregar({ ... }),
// por lo que una extracción hasta `});` es suficiente y deja una regresión muy visible.
for (const [nombre, src] of [
  ['estructuras.js', estructuras], ['construccion.js', construccion],
  ['trochita.js', trochita], ['piezas.js', piezas],
]) {
  const bloques = [...src.matchAll(/col\.agregar\(\{([\s\S]*?)\}\);/g)];
  assert.ok(bloques.length > 0, `no se encontraron colisiones para auditar en ${nombre}`);
  for (const b of bloques) {
    assert.ok(b[1].includes('alturaMin') && b[1].includes('alturaMax'),
      `colisión sin límites verticales en ${nombre}: ${b[0].slice(0, 120).replace(/\s+/g, ' ')}…`);
  }
}

console.log('OK auditoría estructural v3');
