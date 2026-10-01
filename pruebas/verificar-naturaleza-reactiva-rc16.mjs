import fs from 'fs';
import assert from 'assert/strict';
import { firmaSonoraJugador, percepcionMamifero } from '../src/percepcion.js';

const leer = (ruta) => fs.readFileSync(new URL(ruta, import.meta.url), 'utf8');
const veg = leer('../src/vegetacion.js');
const vida = leer('../src/vida.js');
const fauna = leer('../src/fauna.js');
const bichos = leer('../src/bichos.js');
const main = leer('../src/main.js');
const reactiva = leer('../src/naturaleza-reactiva.js');

// Firma acústica: correr sobre superficies ruidosas debe delatar más; sigilo y clima enmascaran.
const correrAgua = firmaSonoraJugador({ velocidadActual: 5, corriendo: true, agachado: false, superficie: 'agua' }, { lluvia: 0, tormenta: false });
const sigiloPasto = firmaSonoraJugador({ velocidadActual: 0.7, corriendo: false, agachado: true, superficie: 'pasto' }, { lluvia: 0, tormenta: false });
const tormenta = firmaSonoraJugador({ velocidadActual: 5, corriendo: true, agachado: false, superficie: 'agua' }, { lluvia: 1, tormenta: true });
assert.ok(correrAgua > sigiloPasto * 4, 'la firma sonora no distingue carrera/sigilo');
assert.ok(tormenta < correrAgua, 'la tormenta debe enmascarar parte del ruido del jugador');

const terreno = (bosque) => ({
  bosque: [bosque, bosque], pasto: [bosque ? 0.4 : 0.1, bosque ? 0.4 : 0.1],
  indice: (x) => x > 5 ? 1 : 0,
});
const js = { pos: { x: 0, z: 0 }, velocidadActual: 1.2, corriendo: false, agachado: false, superficie: 'hojarasca' };
const abierto = percepcionMamifero(terreno(0), { x: 10, z: 0 }, js, {}, 30, 36);
const bosque = percepcionMamifero(terreno(1), { x: 10, z: 0 }, js, {}, 30, 36);
assert.ok(bosque.radioVisual < abierto.radioVisual, 'la cobertura vegetal debe cortar línea visual');
assert.ok(bosque.radioOido > bosque.radioVisual * 0.5, 'la cobertura no debe volver sordos a los animales');

// Contacto visual al suelo: árboles por instancing y mamíferos con sombra barata independiente del shadow map.
assert.match(veg, /registrar\('contactoArbol'/);
assert.match(veg, /grupo === 'contacto'/);
assert.match(veg, /Math\.min\(calidad\.sotobosque, 46\)/);
assert.match(veg, /contactoRef/);
assert.match(reactiva, /CircleGeometry\(1, 18\)/);
assert.match(reactiva, /depthWrite: false/);
assert.match(reactiva, /actualizarSombraContacto/);

// Fauna nativa: usa percepción compartida y microconducta de escucha antes de escapar.
assert.match(fauna, /percepcionMamifero\(T, p\.pos/); // pudú
assert.match(vida, /percepcionMamifero\(T, a\.pos/);  // huemul / ciervos
assert.match(vida, /percepcionMamifero\(T, z\.pos/);  // zorro
assert.match(bichos, /percepcionMamifero\(T, gu\.pos/); // guanaco
assert.match(fauna, /p\.cabeza\.rotation\.y = lerp/);
assert.match(vida, /a\.cabeza\.rotation\.y = lerp/);
assert.match(vida, /z\.cabeza\.rotation\.y = lerp/);
assert.match(bichos, /gu\.cabeza\.rotation\.y = lerp/);
assert.match(bichos, /firmaJugador = firmaSonoraJugador/); // aves de suelo también oyen la aproximación
assert.match(main, /tormenta: !!clima\.estado\.tormenta/);

// Sombras de contacto explícitas en las especies nativas de referencia.
assert.match(fauna, /crearSombraContacto\(escena, 0\.16, 0\.30/);
assert.match(vida, /crearSombraContacto\(escena, 0\.42, 0\.78/);
assert.match(vida, /crearSombraContacto\(escena, 0\.24, 0\.48/);
assert.match(bichos, /crearSombraContacto\(escena, i === 6 \? 0\.30 : 0\.38/);

console.log('OK Naturaleza Reactiva RC16 · firma sonora por superficie/clima · cobertura visual · escucha animal · contacto al suelo instanciado · mamíferos nativos anclados');
