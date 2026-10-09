// 3.5.1: la revisión de bugs del Relax. Lo puro se prueba acá; lo que necesita el mundo
// (dormir dos veces, el zaino al recargar, la hora del reloj) va en pruebas/humo-3-5-1-relax.cjs.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
// localStorage de mentira (guardado.js lo usa)
const almacen = new Map();
globalThis.localStorage = { getItem: (k) => (almacen.has(k) ? almacen.get(k) : null), setItem: (k, v) => almacen.set(k, String(v)), removeItem: (k) => almacen.delete(k), clear: () => almacen.clear(), key: (i) => [...almacen.keys()][i] ?? null, get length() { return almacen.size; } };
import { caballoNuevo, sanearCaballo, dondeEspera, palenque } from '../src/caballo.js';
import { textoOferta, textoDosCambiaron } from '../src/sincronia.js';
import { contadores } from '../src/encargos-temporada.js';
import { estadoHistoria } from '../src/historia.js';
import { progresoNuevo, guardarProgreso, cargarProgreso } from '../src/guardado.js';
import { torneoLocalNuevo, torneoDeLaSemana, anotarPropio, codigoPuntaje, leerCodigoPuntaje, sumarAmigo } from '../src/torneo.js';
import { eventosValleNuevos, cerrarSeguimiento } from '../src/eventos-valle.js';

const leer = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const main = leer('src/main.js');

// ---- el zaino que nunca se movió: null no es el 0 del mapa
const ref = { x: -120, z: 232, puerta: { x: -118, z: 236 } };
assert.deepEqual(sanearCaballo({ x: null, z: null, yaw: 0 }), caballoNuevo(), 'null (nunca lo moviste) sigue siendo null al cargar');
assert.deepEqual(sanearCaballo(JSON.parse(JSON.stringify(caballoNuevo()))), caballoNuevo(), 'ida y vuelta por JSON: sigue en el palenque');
assert.deepEqual(sanearCaballo({ x: 0, z: 0, yaw: 0 }), caballoNuevo(), 'las partidas que ya lo tenían en 0,0 lo devuelven al palenque');
assert.deepEqual(sanearCaballo({ x: '', z: '' }), caballoNuevo());
assert.deepEqual(sanearCaballo({ x: 12, z: -3, yaw: 1 }), { x: 12, z: -3, yaw: 1 }, 'donde lo dejaste, se respeta');
assert.deepEqual(sanearCaballo({ x: 0, z: 7 }), { x: 0, z: 7, yaw: 0 }, 'un cero de verdad en un solo eje se respeta');
assert.deepEqual(dondeEspera(sanearCaballo(JSON.parse(JSON.stringify(caballoNuevo()))), ref), palenque(ref));

// ---- dormir: el fundido no deja dormir de nuevo encima
assert.match(main, /let durmiendo = false;\nconst claveNocheReloj|let durmiendo = false;/, 'hay una marca de "durmiendo"');
assert.match(main, /function dormir\(\) \{\n  if \(durmiendo\) return;/, 'dormir no se vuelve a armar durante el fundido');
assert.match(main, /durmiendo = true;\n  setTimeout\(/, 'se marca al empezar el fundido');
assert.match(main, /jugador\.sentarse\(false\);\n      durmiendo = false;/, 'y se suelta al despertar');

// ---- la hora de tu reloj: una noche, un día; la medianoche cambia el día
assert.match(main, /if \(nocheReloj && progreso\.relojNoche === nocheReloj\) \{ nota\('Ya dormiste esta noche'/, 'con el reloj, la misma noche no se duerme dos veces');
// 3.8.3: también en el modo de combate (sin el día nuevo, a la medianoche salía otra oleada): ya sin `!desafio`
assert.match(main, /if \(antes - progreso\.horas > 12 && progreso\.relojNoche !== claveNocheReloj\(d\)\) \{ progreso\.dia\+\+;/, 'la medianoche del reloj cambia el día');

// ---- la carpeta sincronizada: si las dos siguieron, se pregunta igual
const local = { hay: true, dia: 12, guardadoEn: Date.UTC(2026, 9, 1, 14) }, remota = { progreso: { dia: 10, guardadoEn: Date.UTC(2026, 9, 1, 13) } };
assert.match(textoDosCambiaron(local, remota), /no vio: día 10/);
assert.match(textoDosCambiaron(local, remota), /Acá también se siguió jugando: día 12/);
assert.match(textoOferta(local, remota), /más nueva/, 'la oferta de siempre sigue igual');
assert.ok(main.includes("if (enCarpeta <= baseSync || (local?.hay && Number(local.guardadoEn) === enCarpeta)) { fijarBaseSync(enCarpeta); return; }"), 'sólo no se pregunta lo que ya se vio');
assert.ok(main.includes("dialogos.confirmar(masNueva ? textoOfertaSync(local, r.paquete) : textoDosCambiaron(local, r.paquete))"), 'si la otra escribió después, se pregunta');

// ---- lo talado y lo cosechado no bajan (los tocones rebrotan, lo cosechado se gasta)
assert.equal(contadores({ talados: [], taladosTotal: 9 }).talados, 9, 'los tocones que rebrotaron siguen contando');
assert.equal(contadores({ talados: [1, 2, 3] }).talados, 3, 'una partida vieja cuenta los tocones');
assert.equal(estadoHistoria({ entradas: { haba: { cantidad: 0 } }, cosechasTotal: 7 }).cosechas, 7, 'lo cosechado aunque se haya gastado');
assert.equal(estadoHistoria({ entradas: { haba: { cantidad: 4 }, papa: { cantidad: 2 } } }).cosechas, 6, 'sin la cuenta, lo de antes');
{
  const p = progresoNuevo(); p.talados = [{ i: 3, dia: 1, esc: 0 }, { i: 9, dia: 1, esc: 0 }]; p.entradas = { haba: { dia: 1, hora: 9, cantidad: 5 } };
  guardarProgreso(p);
  const c = cargarProgreso();
  assert.equal(c.taladosTotal, 2, 'una partida vieja arranca con lo talado que tiene');
  assert.equal(c.cosechasTotal, 5, 'y con lo cosechado que tiene');
  c.taladosTotal = 11; c.talados = []; c.cosechasTotal = 30; guardarProgreso(c);
  const d = cargarProgreso();
  assert.ok(d.taladosTotal === 11 && d.cosechasTotal === 30, 'y no se pierde al guardar');
}
assert.ok(main.includes("progreso.taladosTotal = Math.max("), 'cada árbol talado suma');
assert.ok(main.includes("progreso.cosechasTotal = ("), 'cada cosecha suma');

// ---- construir: las piezas de varias etapas se siguen levantando; desmontar devuelve lo de adentro
assert.ok(main.includes("function piezaAMedias(plano, pos, radio)"));
assert.ok(main.includes("const obra = obras.plano?.pieza ? piezaAMedias(obras.plano, js.pos, 10)"), 'Y sigue el molino, el aserradero y la estación a medio hacer');
assert.ok(main.includes("devolverContenido(r.datos);   // 3.5.1"), 'desmontar devuelve lo guardado');
assert.ok(leer('src/construccion.js').includes("if (n > 1) recupera[k] = (recupera[k] || 0) + Math.max(1, Math.floor(n * 0.5));"), 'lo que costó 1 no vuelve entero');
assert.ok(main.includes("function mudarDatosDeObra(o, x0, z0)"), 'mover una obra muda sus huevos y su cantero');   // (3.6: ya no hay pobladores en tus casas)

// ---- el modo foto no toca el reloj del juego ni cumple desafíos con la cámara libre
assert.ok(main.includes("if (foto.activo && codigo !== 'KeyP') return;"));
assert.ok(main.includes("if (foto.activo) vistos.length = 0;"));
assert.ok(main.includes("if (!foto.activo) actualizarTendales();"));

// ---- premios, mando, banco, tirolesa
assert.ok(main.includes("if (Number(yaTenias[c]) > 1) progreso.cosas[c] = Number(yaTenias[c]);"), 'el cierre del valle no deja la yerba en 1');
assert.ok(main.includes("if (accion && teclasPropias[accion]) code = teclasPropias[accion];"), 'el mando sigue las teclas propias');
assert.ok(main.includes("  if (banco?.activa) return false;"), 'el banco de pruebas no guarda');
assert.ok(main.includes("if (js.enCable && codigo === 'Escape') { abrir('pausa'); return; }"), 'en la tirolesa, Esc pausa');
assert.ok(leer('src/plantilla.html').includes(".estado { position: absolute; left: 50%; bottom: 94px;"), 'el estado va arriba de la barra de casillas');

// ---- el torneo: pegar tu propio código (con acento en el nombre) no te suma dos veces
{
  const local = torneoLocalNuevo('pc1'); local.nombre = 'José Peña';
  const t = torneoDeLaSemana(new Date(2026, 9, 1));
  anotarPropio(local, t, { pesca: 40 });
  const propia = local.propias.find((e) => e.semana === t.semana) || local.propias[0];
  const leido = leerCodigoPuntaje(codigoPuntaje({ ...propia, nombre: local.nombre }));
  assert.ok(leido, 'el código propio se lee');
  assert.equal(sumarAmigo(local, leido), false, 'y no entra como amigo');
  assert.equal(sumarAmigo(local, { ...leido, nombre: 'Ana' }), true, 'el de otro sí');
}
// ---- los eventos: sin vecinos, "el puente cedió" no trae a Nicanor
{
  const ev = eventosValleNuevos(() => 0.5); ev.pendientes.push({ id: 's-puente-caida', dia: 3 });
  const r = cerrarSeguimiento(ev, 's-puente-caida', 3, { vecinos: false });
  assert.ok(r && !r.cadena && !ev.activo, 'sin vecinos no hay evento encadenado de un vecino');
  const ev2 = eventosValleNuevos(() => 0.5); ev2.pendientes.push({ id: 's-puente-caida', dia: 3 });
  assert.equal(cerrarSeguimiento(ev2, 's-puente-caida', 3).cadena?.id, 'tobillo', 'con vecinos, sigue como siempre');
}

const pkg = JSON.parse(leer('package.json'));
assert.ok(pkg.scripts.verify.includes('node pruebas/verificar-3-5-1-relax.mjs'), 'la prueba corre en verify');
console.log('verificar-3-5-1-relax: ok · zaino en el palenque, dormir y reloj sin saltar días, sync que pregunta, contadores que no bajan, piezas por etapas, modo foto sin trampas');
