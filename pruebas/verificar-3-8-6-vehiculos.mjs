// 3.8.6 (vehículos): el pase de bugs de los vehículos, la cocina, la granja y el mundo. Una comprobación por arreglo.
//  1. El caballo en el puente colgante: Escape (o B) no elige «Amarrarlo acá»; seguís montado.
//  2. La locomotora sola (sin coches): la vuelta completa manejando cuenta, Elsa no queda «en viaje» y el andén no dice
//     «E para subir» (no hay coche de pasajeros: se sube a la cabina).
//  3. Granja: el hoyo 25 no se arma (se armaba, costaba un tronco y quedaba muerto); con el verano fijado las peras maduran
//     y lo que no madura con la estación fijada no promete un día; la batea pide lo que acepta; «Del novillo».
//  4. Kayak, velero y sulky: en la pausa (o el cuaderno, el mapa, un cuadro) el mando se lee una vez (con el mando solo no se
//     salía de la pausa en el kayak, el velero o el tren) y el kayak y el velero quedan quietos (el velero seguía navegando);
//     en el Desafío subir al kayak no borra el amarre; en el sulky H, B, T, F, Y, O y G no hacen nada (armaba la carpa en
//     el camino).
//  5. Cocina: los invitados del asado esperan ese día nomás (un asado sin sacar los dejaba todos los días parados alrededor
//     de la parrilla); «Queda 1»; el perro no roba de una parrilla desarmada.
//  6. El puesto de cargas abierto a la medianoche se rehace (se veía la lista de ayer y el número elegía de la de hoy).
//  7. El bosque: pasados los 96 tocones, el más viejo deja de verse y también de frenar (quedaba un tronco invisible).
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

// 4. kayak, velero, sulky
{
  const m = leer('src/main.js');
  ok(m.includes("else { if (modo === 'jugando') leerMando(dt); jugador.actualizar(modo !== 'jugando' && jugador.estado.enKayak ? 0 : dt); }"), 'en la pausa: el mando una vez y el kayak/velero quieto');
  ok(m.includes("if (modo === 'pausa' || modo === 'cuaderno' || modo === 'mapa') leerMandoEnMenu();"), 'el menú sigue leyendo el mando');
  ok(m.includes('kayak.subir(jugador); if (!desafio) progreso.kayakAmarre = null;') && m.includes('if (!desafio) progreso.kayakAmarre = amarreDe(o);'), 'el amarre del kayak, sólo en el Relax (al anotar y al soltar)');
  ok(m.includes("if (js.enSulky && ['KeyH', 'KeyB', 'KeyT', 'KeyF', 'KeyY', 'KeyO', 'KeyG'].includes(codigo)) { nota('Con las riendas en la mano, no', 'Bajate del sulky con E'); return; }"), 'en el sulky, las otras teclas no');
  const VR = await src('vela-reglas.js');
  const e0 = { x: 1, z: 2, rumbo: 0.3, vel: 2, giro: 0, escota: 0.5 };
  const e1 = VR.pasoVela({ ...e0 }, {}, 0, 6, 1);
  ok(Math.abs(e1.x - 1) < 1e-9 && Math.abs(e1.z - 2) < 1e-9, 'con dt 0 el velero no se mueve');
}

// 5. la cocina
{
  const CP = await src('cocina-pasos.js');
  const c = CP.sanearCoccion({ receta: 'asado', paso: 1, invitados: ['abuela'], invitoDia: 12 }, 14);
  ok(c && c.invitoDia === 12 && c.invitados.length === 1, 'el día de los invitados se guarda');
  const c2 = CP.sanearCoccion({ receta: 'asado', paso: 1, invitados: ['abuela'] }, 14);
  ok(c2 && c2.invitoDia === 0, 'una partida de antes: los invitados ya no esperan');
  ok(!('invitoDia' in CP.sanearCoccion({ receta: 'asado', paso: 1 }, 14)), 'sin invitados, nada');
  const cj = leer('src/cocina-juego.js');
  ok(cj.includes('const claves = c && c.invitoDia === dia() ? c.invitados || [] : [];') && cj.includes('c.invitoDia = dia();   // 3.8.6'), 'esperan el día en que vinieron');
  ok(cj.includes("${quedan === 1 ? 'Queda' : 'Quedan'} ${quedan} en la alacena") && leer('src/main.js').includes("${e.cantidad === 1 ? 'Te queda' : 'Te quedan'} ${e.cantidad}"), '«Queda 1», «Te queda 1»');
  ok(cj.includes('if (!c || c.robado || (lista && !lista.includes(perroFase.o))) { perroFase = null; return; }'), 'el perro no roba de una parrilla desarmada');
}

// 6. el puesto de cargas a la medianoche
{
  const cm = leer('src/comercio-mundo.js');
  ok(cm.includes('estado.dia = ctx.dia(); estado.temporada = ctx.temporada();') && cm.includes('if (estado.dia !== ctx.dia() || estado.temporada !== ctx.temporada()) dibujar();'), 'abierto a la medianoche, se rehace');
  ok(cm.includes("if (ctx.panel && (estado.dia !== ctx.dia() || estado.temporada !== ctx.temporada())) { dibujar(); return false; }"), 'y elegir no toma lo de ayer');
}

// 7. los tocones que ya no se ven no frenan
{
  const v = leer('src/vegetacion.js');
  ok(v.includes('if (tocones.length >= MAX_TOCONES) { const viejo = tocones.shift(); if (viejo?.arbol?.choque && viejo.arbol.sacado) viejo.arbol.choque.sinTocon = true; }') && v.includes('if (a.choque) a.choque.sinTocon = false;'), 'el tocón que sale del tope apaga su choque (y el que vuelve, lo prende)');
  ok(v.includes('if (a.choque) { a.choque.apagado = false; a.choque.sinTocon = false; }'), 'el árbol que rebrota entero frena otra vez');
  const { crearColisiones } = await src('colisiones.js').catch(() => ({}));
  const cl = leer('src/colisiones.js');
  ok(cl.includes('if (o.sinTocon) continue;'), 'colisiones.js no empuja con un choque sin tocón');
  if (typeof crearColisiones === 'function') {
    const col = crearColisiones();
    const choque = { x: 0, z: 0, r: 0.6 };
    col.agregar(choque);
    const p = { x: 0.2, y: 0, z: 0 };
    col.resolver(p, 0.35, 1.7);
    ok(Math.hypot(p.x, p.z) >= 0.94, 'con tocón, empuja');
    choque.sinTocon = true;
    const q = { x: 0.2, y: 0, z: 0 };
    col.resolver(q, 0.35, 1.7);
    ok(q.x === 0.2 && q.z === 0, 'sin tocón, no');
  }
}

console.log(`verificar-3-8-6-vehiculos: ${pasos} comprobaciones OK`);
