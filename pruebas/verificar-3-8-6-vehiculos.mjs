// 3.8.6 (vehículos): el pase de bugs de los vehículos, la cocina, la granja y el mundo. Una comprobación por arreglo.
//  1. El caballo en el puente colgante: Escape (o B) no elige «Amarrarlo acá»; seguís montado.
//  2. La locomotora sola (sin coches): la vuelta completa manejando cuenta, Elsa no queda «en viaje» y el andén no dice
//     «E para subir» (no hay coche de pasajeros: se sube a la cabina).
//  3. Granja: el hoyo 25 no se arma (se armaba, costaba un tronco y quedaba muerto); con el verano fijado las peras maduran
//     y lo que no madura con la estación fijada no promete un día; la batea pide lo que acepta; «Del novillo».
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

// 3. la granja
{
  const G = await src('granja.js');
  const c = leer('src/construccion.js'), pg = leer('src/planos-granja.js');
  ok(c.includes("if (Number.isFinite(plano.maximo) && obras.filter((o) => o !== ignorarObra && o.plano.id === plano.id).length >= plano.maximo) return { ok: false, motivo: plano.motivoMaximo"), 'construir respeta el tope del plano');
  ok(pg.includes('maximo: GRANJA.frutales, motivoMaximo: `Ya tenés ${GRANJA.frutales} hoyos para frutales: no entran más`'), 'el hoyo para frutal, con el tope de la granja');
  eq(G.GRANJA.frutales, 24, 'el tope es 24');
  const peral = { especie: 'peral', plantado: 1, cosecha: -1 }, manzano = { especie: 'manzano', plantado: 1, cosecha: -1 };
  ok(G.estadoFrutal(peral, 9, 12, 'verano').fruta === 'madura', 'con el verano fijado, las peras maduran');
  eq(G.primeraFruta(peral, 'verano'), 7, 'y lo dice: el día que es grande');
  ok(G.estadoFrutal(manzano, 9, 12, 'verano').fruta === 'no' && G.primeraFruta(manzano, 'verano') === null, 'las manzanas (de otoño) no, con el verano fijado');
  eq(G.textoFrutal(manzano, 9, 12, null, 'verano'), 'Manzano · manzanas en otoño: con la estación fija en verano, no maduran', 'el aviso del manzano grande');
  eq(G.textoFrutal(manzano, 3, 12, null, 'verano'), 'Manzano joven · con la estación fija en verano, no da manzanas', 'el aviso del manzano chico');
  eq(G.textoFrutal(manzano, 3, 12, null, 'invierno'), 'Manzano joven · con la estación fija en invierno, no da manzanas', 'en invierno fijado, tampoco promete');
  ok(G.primeraFruta(manzano, 'otono') === 7 && G.estadoFrutal(manzano, 7, 12, 'otono').fruta === 'madura', 'con el otoño fijado, madura apenas es grande');
  eq(G.primeraFruta(manzano), G.primeraFruta(manzano, 'auto'), 'con las estaciones automáticas, como siempre');
  const gj = leer('src/granja-juego.js');
  ok(gj.includes("r.motivo === 'sinSobras' ? 'Papas, habas, manzanas, peras o ciruelas' : ''"), 'la batea pide lo que acepta');
  ok(gj.includes("`Del ${NOMBRE_ANIMAL[e.que].replace(/^el /, '')}: ${que}. Está en la mochila`"), '«Del novillo»');
  ok(gj.includes('const p = primeraFruta(f, estacionFrutal());'), 'al plantar, la primera fruta con la estación de Ajustes');
}

console.log(`verificar-3-8-6-vehiculos: ${pasos} comprobaciones OK`);
