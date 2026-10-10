// 3.8.6 (base): el pase de bugs de lo transversal (guardado y carga, menús, mando, calidad, rendimiento y Electron),
// sin Electron. Una comprobación (o varias) por arreglo; lo que necesita el juego de verdad está en humo-3-8-6-base.cjs.
import fs from 'node:fs';
import assert from 'node:assert/strict';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const main = leer('src/main.js');
const tramo = (desde, largo = 3000) => { const i = main.indexOf(desde); assert.ok(i >= 0, `no está: ${desde}`); return main.slice(i, i + largo); };

// 1. El mando se lee una vez por cuadro en cualquier pantalla. Antes: (a) en un cuadro de pregunta, la tarjeta del valle o la
//    victoria no se leía, y el botón con el que se cerraban (A o B) contaba como recién apretado al volver (saltar,
//    agacharse, o cerrar también la pausa); (b) en el tren o el kayak con la pausa abierta se leía dos veces por cuadro y
//    Start y B no sacaban de la pausa; (c) con el mando solo, la tarjeta del valle y la victoria no se podían manejar.
{
  const actual = tramo('function leerMandoActual() {', 200);
  ok(/if \(mandoLeido\) return mando\.estado\(\);\s*mandoLeido = true;\s*return mando\.actualizar\(\);/.test(actual), 'una sola lectura por cuadro');
  ok((main.match(/mando\.actualizar\(\)/g) || []).length === 1, 'nadie más lee el mando por su lado');
  ok(/const m = leerMandoActual\(\);/.test(tramo('function leerMando(dt) {', 120)), 'jugando, por la lectura única');
  const menu = tramo('function leerMandoEnMenu() {', 500);
  ok(/const m = leerMandoActual\(\);/.test(menu) && menu.includes('if (dialogos.abierto()) return;'), 'en la pausa, por la lectura única y sin pisar al cuadro de pregunta');
  ok(/leerMandoEnMenu\(\);[^\n]*\n\s*if \(!mandoLeido\) leerMandoQuieto\(\);[^\n]*\n\s*mandoLeido = false;/.test(main), 'el bucle lee el mando en cualquier otra pantalla y se prepara para el cuadro siguiente');
  const quieto = tramo('function leerMandoQuieto() {', 1400);
  ok(quieto.includes("modo === 'valle' ? $('valle-tarjeta') : modo === 'victoria' ? $('victoria')"), 'la tarjeta del valle y la victoria, con el mando');
  ok(quieto.includes('moverFocoEn(caja, mover)') && quieto.includes('b.click()'), 'la cruceta pasa de botón y A lo aprieta');
  ok(quieto.includes("if (m.recien.agacharse && modo === 'valle') golpeDeTecla('Escape');"), 'B cierra las tarjetas de un botón (como Esc)');
}

console.log(`✓ verificar-3-8-6-base: ${n} comprobaciones`);
