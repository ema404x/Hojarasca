// 3.8.6 (vehículos): el pase de bugs de los vehículos, la cocina, la granja y el mundo. Una comprobación por arreglo.
//  1. El caballo en el puente colgante: Escape (o B) no elige «Amarrarlo acá»; seguís montado.
//  2. La locomotora sola (sin coches): la vuelta completa manejando cuenta, Elsa no queda «en viaje» y el andén no dice
//     «E para subir» (no hay coche de pasajeros: se sube a la cabina).
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
const src = (f) => import(new URL(`../src/${f}`, import.meta.url));
let pasos = 0;
const ok = (c, t) => { assert.ok(c, t); pasos++; };
const eq = (a, b, t) => { assert.deepEqual(a, b, t); pasos++; };

// 1. el cuadro de dos opciones: «No» hace algo, Escape no
{
  const D = await src('dialogo.js');
  const vista = { mostrar() {}, ocultar() {}, valor: () => '' };
  const cola = D.crearColaDialogos(vista);
  let r = cola.confirmar('¿Lo mandás o lo amarrás?', { si: 'Mandarlo', no: 'Amarrarlo acá', cancelado: null });
  cola.tecla('Escape');
  eq(await r, null, 'Escape en el puente: ni mandarlo ni amarrarlo');
  r = cola.confirmar('¿Lo mandás o lo amarrás?', { si: 'Mandarlo', no: 'Amarrarlo acá', cancelado: null });
  cola.rechazar();
  eq(await r, false, 'el botón «Amarrarlo acá» sigue amarrando');
  r = cola.confirmar('¿Lo mandás o lo amarrás?', { si: 'Mandarlo', no: 'Amarrarlo acá', cancelado: null });
  cola.tecla('Enter');
  eq(await r, true, 'Enter manda');
  r = cola.confirmar('¿Seguro?');
  cola.tecla('Escape');
  eq(await r, false, 'los demás cuadros: Escape sigue siendo «No»');
  r = cola.pedirTexto('¿Nombre?', 'x');
  cola.rechazar();
  eq(await r, null, 'en los de texto, «Cancelar» sigue dando null');
  const d = leer('src/dialogo.js');
  ok(d.includes("$('dialogo-no')?.addEventListener('click', () => cola.rechazar());"), 'el botón «No» rechaza (no cancela)');
  const m = leer('src/main.js');
  ok(m.includes("{ si: 'Mandarlo al refugio', no: 'Amarrarlo acá', cancelado: null }") && m.includes('if (mandar === null || !jugador.estado.montado) return;'), 'el puente: Escape te deja montado');
}

// 2. la locomotora sola
{
  const m = leer('src/main.js'), t = leer('src/trochita.js');
  ok(m.includes('if (estadoTren) gente.ubicarGuarda(estadoTren.guarda, estadoTren.guarda?.rumbo, js.enTren && !!estadoTren.guarda);'), 'sin guarda, Elsa no queda en viaje');
  ok(m.includes('y la vuelta manejando nunca se contaba)\n  if (estadoTren) {\n    if (js.enTren && estadoTren.recorrido >= estadoTren.vuelta * 0.98) {'), 'la vuelta se cuenta aunque no haya guarda');
  ok(t.includes('soloLocomotora: () => !hayCoches(),') && m.includes('la locomotora está en el andén, sin coches · E al lado de la cabina para manejar'), 'el andén con la locomotora sola');
  const V = await src('tren-viaje.js');
  eq(V.composicionDe({ vagones: { pasajeros: true }, composicion: [] }), [], 'con vagones y ninguno enganchado, sale sola');
}

console.log(`verificar-3-8-6-vehiculos: ${pasos} comprobaciones OK`);
