import fs from 'node:fs';
import assert from 'node:assert/strict';

const src = fs.readFileSync(new URL('../src/estructuras.js', import.meta.url), 'utf8');

const ocurrencias = (texto) => (src.match(new RegExp(texto, 'g')) || []).length;

assert.ok(src.includes('const techoDosAguasDetallado'), 'Falta el sistema de cubierta 2.0');
assert.ok(ocurrencias('techoDosAguasDetallado\\(c,') >= 5, 'Las cubiertas 2.0 no están aplicadas a los edificios principales');
assert.ok(src.includes('const pilotesAlTerreno'), 'Falta apoyo adaptado al terreno');
assert.ok(src.includes('const serieCerchas'), 'Falta el sistema de cerchas');
assert.ok(src.includes('const entabladoVertical'), 'Falta el entablado con huecos rectangulares');

// Regresión: la cabaña tenía dos techos superpuestos con pendientes distintas.
assert.ok(!src.includes('const incl = Math.atan2(1.3, W / 2)'), 'Regresó el techo duplicado de la cabaña');

// Regresión: la rampa del galpón era sólo visual.
assert.ok(src.includes('PG.escalon({ lx: W / 2 + 0.6 + i * 0.42'), 'La rampa del galpón debe participar de la física');

// Regresión: los detalles de Casa de Té se agregaban luego de c.geometria() y no se renderizaban.
const inicioTe = src.indexOf('// ---------------------------------------------------------------- casa de té');
const finTe = src.indexOf('// ---------------------------------------------------------------- torre de guardaparques', inicioTe);
assert.ok(inicioTe >= 0 && finTe > inicioTe, 'No se pudo aislar Casa de Té');
const te = src.slice(inicioTe, finTe);
const materializado = te.indexOf('c.geometria()');
const techo = te.indexOf('techoDosAguasDetallado(c');
assert.ok(materializado >= 0 && techo >= 0 && techo < materializado, 'La cubierta de Casa de Té debe entrar en la geometría antes de materializarla');

// Las paredes de edificios principales deben tener cotas verticales, evitando barreras infinitas.
for (const token of ['PARED_TE', 'PARED_AL', 'PARED_GAL']) {
  assert.ok(src.includes(token), `Falta preset de colisión ${token}`);
}

// Regresión: en el faro, piso y escalones deben declararse antes de crear la malla.
const inicioFaro = src.indexOf('// ---------------------------------------------------------------- faro');
const finFaro = src.indexOf('// ---------------------------------------------------------------- lugar llano y despejado', inicioFaro);
assert.ok(inicioFaro >= 0 && finFaro > inicioFaro, 'No se pudo aislar Faro');
const faro = src.slice(inicioFaro, finFaro);
const geoFaro = faro.indexOf('new THREE.Mesh(c.geometria(), mat)');
assert.ok(faro.indexOf("P.pisoRedondo({ radio: R_BASE - 0.15") < geoFaro, 'El piso inferior del faro no puede agregarse después de materializar la malla');
assert.ok(faro.indexOf('P.escalon({') < geoFaro, 'Los escalones del faro deben existir visual y físicamente antes de materializar');
assert.ok(/alturaMax:\s*1\.3[0-9]?/.test(faro), 'El zócalo del faro debe tener colisión acotada en altura');
assert.ok(faro.includes('hueco: HUECO_PUERTA'), 'El zócalo del faro debe respetar visual y físicamente el vano de la puerta');

console.log('OK arquitectura estructural v2');
