// 1.6: jugar con joystick y las opciones de accesibilidad (teclas, letra, colores, subtítulos).
import assert from 'node:assert/strict';
import { mapearMando, estadoVacio, crearMando, zonaMuertaRadial, curvaMirada, girarMirada, textoBoton, BOTONES_MANDO, ACCIONES_MANDO, VELOCIDAD_MIRADA } from '../src/mando.js';
import {
  TECLAS_POR_DEFECTO, ACCIONES_TECLA, mapaPorDefecto, cambiarTecla, sanearMapaTeclas, accionDeTecla, teclasCambiadas, textoTecla,
  TAMANOS_LETRA, escalaLetra, siguienteTamano, PALETAS, paleta, colorDe, adaptarColor, subtitulos, apilarAviso, textoHora,
} from '../src/accesibilidad.js';

// un mando de mentira: ejes en cero y todos los botones sueltos
const pad = (axes = [0, 0, 0, 0], apretados = []) => ({
  id: 'Xbox 360 Controller (STANDARD GAMEPAD)',
  axes,
  buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: apretados.includes(i), value: apretados.includes(i) ? 1 : 0 })),
});

// ------------------------------------------------------------------ zona muerta
const quieto = mapearMando(pad([0.1, -0.09, 0.05, 0.05]));
assert.equal(quieto.mov.x, 0, 'el stick apenas movido no camina');
assert.equal(quieto.mov.z, 0);
assert.equal(quieto.mirada.x, 0, 'ni mueve la cámara sola');
assert.equal(quieto.mirada.y, 0);
assert.equal(quieto.fuerzaMov, 0);
assert.equal(quieto.conectado, true);
assert.match(quieto.nombre, /Xbox/);
assert.deepEqual(zonaMuertaRadial(0.05, 0, 0.18), { x: 0, y: 0, fuerza: 0 });

// justo afuera de la zona muerta arranca despacito, no de un saque
const apenas = mapearMando(pad([0, -0.25]));
assert.ok(apenas.mov.z > 0 && apenas.mov.z < 0.15, 'saliendo de la zona muerta se camina lento');

// ------------------------------------------------------------------ stick al máximo
const aFondo = mapearMando(pad([0, -1, 1, 0]));
assert.equal(aFondo.mov.z, 1, 'stick a fondo adelante = 1');
assert.equal(aFondo.mov.x, 0);
assert.equal(aFondo.fuerzaMov, 1);
assert.equal(aFondo.mirada.x, 1, 'la mirada a fondo también llega a 1');
assert.equal(mapearMando(pad([1, 0])).mov.x, 1, 'a la derecha, x positivo');
assert.equal(mapearMando(pad([0, 1])).mov.z, -1, 'hacia atrás, z negativo');
// en diagonal no se camina más rápido que derecho
const diag = mapearMando(pad([1, -1]));
assert.ok(Math.abs(Math.hypot(diag.mov.x, diag.mov.z) - 1) < 1e-9, 'la diagonal no acelera');

// curva de respuesta: medio stick mueve mucho menos que medio
assert.ok(Math.abs(curvaMirada(0.5, 2) - 0.25) < 1e-9);
assert.equal(curvaMirada(-1, 2), -1);
const suave = mapearMando(pad([0, 0, 0.5, 0]), estadoVacio(), { zonaMuertaMirada: 0 });
assert.ok(Math.abs(suave.mirada.x - 0.25) < 1e-9, 'la curva es cuadrática');
// sensibilidad propia, aparte de la del mouse
assert.ok(Math.abs(mapearMando(pad([0, 0, 1, 0]), estadoVacio(), { sensibilidad: 2 }).mirada.x - 2) < 1e-9);
// invertir el eje Y
assert.equal(mapearMando(pad([0, 0, 0, 1]), estadoVacio(), { invertirY: true }).mirada.y, -1);

// la mirada gira el yaw como lo hace el mouse
const est = { yaw: 0, pitch: 0 };
girarMirada(est, { x: 1, y: 0 }, 0.5);
assert.ok(Math.abs(est.yaw + VELOCIDAD_MIRADA * 0.5) < 1e-9, 'stick a la derecha, yaw para el otro lado');
girarMirada(est, { x: 0, y: -1 }, 100);
assert.equal(est.pitch, 1.45, 'el pitch tiene tope');

// ------------------------------------------------------------------ flancos
const c1 = mapearMando(pad([0, 0, 0, 0], [BOTONES_MANDO.interactuar]));
assert.equal(c1.activos.interactuar, true);
assert.equal(c1.recien.interactuar, true, 'el primer cuadro es un flanco');
assert.equal(c1.soltados.interactuar, false);
const c2 = mapearMando(pad([0, 0, 0, 0], [BOTONES_MANDO.interactuar]), c1);
assert.equal(c2.activos.interactuar, true);
assert.equal(c2.recien.interactuar, false, 'seguir apretado ya no es flanco');
const c3 = mapearMando(pad(), c2);
assert.equal(c3.activos.interactuar, false);
assert.equal(c3.soltados.interactuar, true, 'al soltar avisa una vez');
assert.equal(mapearMando(pad(), c3).soltados.interactuar, false);
// los gatillos son analógicos: recién cuentan pasado el umbral
const gatillo = (v) => ({ axes: [0, 0, 0, 0], buttons: Object.assign(Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })), { 7: { pressed: false, value: v } }) });
assert.equal(mapearMando(gatillo(0.2)).activos.atacar, false, 'el gatillo rozado no ataca');
assert.equal(mapearMando(gatillo(0.9)).activos.atacar, true);
// todas las acciones del juego tienen botón y nombre para mostrar
for (const a of ['interactuar', 'atacar', 'bloquear', 'saltar', 'correr', 'agacharse', 'esquivar', 'linterna', 'mochila', 'planos', 'taller', 'guia', 'pausa', 'objetoAnterior', 'objetoSiguiente']) {
  assert.ok(ACCIONES_MANDO.includes(a), `falta la acción ${a}`);
  assert.ok(textoBoton(a), `${a} no tiene botón que mostrar`);
}
assert.equal(textoBoton('objetoAnterior'), 'L1');

// ------------------------------------------------------------------ sin mando no rompe nada
const sinMando = mapearMando(null);
assert.equal(sinMando.conectado, false);
assert.deepEqual(sinMando.mov, { x: 0, z: 0 });
assert.deepEqual(sinMando.mirada, { x: 0, y: 0 });
assert.equal(Object.values(sinMando.recien).some(Boolean), false, 'sin mando no se aprieta nada');
assert.equal(mapearMando(undefined, c1).soltados.interactuar, true, 'si se desenchufa apretado, se da por soltado');
assert.deepEqual(mapearMando({}).mov, { x: 0, z: 0 }, 'un mando sin ejes ni botones no explota');
assert.deepEqual(mapearMando({ axes: null, buttons: null }).mirada, { x: 0, y: 0 });
assert.equal(mapearMando({ axes: [NaN, 'x'], buttons: [null, 7] }).fuerzaMov, 0, 'ejes con basura = quieto');
assert.equal(mapearMando(pad(), null).recien.saltar, false, 'sin estado anterior tampoco rompe');
// el módulo se puede usar en Node, donde no hay navigator.getGamepads
const m = crearMando({ zonaMuerta: 0.2 });
assert.equal(m.actualizar().conectado, false);
assert.equal(m.hayMando(), false);
assert.equal(m.recien('saltar'), false);
// con un lector propio anda igual (así lo prueba el juego sin joystick de verdad)
let crudo = pad([0, -1], [BOTONES_MANDO.saltar]);
const m2 = crearMando({ leerCrudo: () => crudo });
m2.actualizar();
assert.equal(m2.recien('saltar'), true);
m2.actualizar();
assert.equal(m2.recien('saltar'), false);
assert.equal(m2.activo('saltar'), true);
assert.equal(m2.estado().mov.z, 1);
m2.olvidar();
assert.equal(m2.hayMando(), false, 'olvidar limpia todo');
crudo = null;
assert.equal(m2.actualizar().conectado, false);

// ------------------------------------------------------------------ remapeo de teclas
assert.deepEqual(mapaPorDefecto(), TECLAS_POR_DEFECTO);
assert.notEqual(mapaPorDefecto(), TECLAS_POR_DEFECTO, 'devuelve una copia');
for (const c of ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyE', 'KeyH', 'KeyY', 'KeyO', 'KeyK', 'KeyF', 'KeyI', 'KeyJ', 'KeyM', 'KeyL', 'KeyZ', 'KeyP', 'F1', 'Escape', 'Space', 'ShiftLeft', 'KeyC']) {
  assert.ok(Object.values(TECLAS_POR_DEFECTO).includes(c), `el mapa por defecto no usa ${c}`);
}
const base = mapaPorDefecto();
const ok = cambiarTecla(base, 'linterna', 'KeyN');
assert.equal(ok.ok, true);
assert.equal(ok.mapa.linterna, 'KeyN');
assert.equal(base.linterna, 'KeyL', 'no toca el mapa que le pasaron');
assert.deepEqual(teclasCambiadas(ok.mapa), ['linterna']);
// duplicada: se rechaza y dice de quién es
const dup = cambiarTecla(base, 'linterna', 'KeyJ');
assert.equal(dup.ok, false);
assert.match(dup.motivo, /Cuaderno/, 'el motivo dice qué acción la tiene');
assert.equal(dup.mapa.linterna, 'KeyL', 'el mapa queda como estaba');
assert.equal(cambiarTecla(base, 'volar', 'KeyN').ok, false, 'acción inventada');
assert.equal(cambiarTecla(base, 'linterna', 'banana').ok, false, 'código inventado');
assert.equal(cambiarTecla(base, 'linterna', 'Escape').ok, false, 'Esc no se puede robar');
assert.equal(cambiarTecla(base, 'pausa', 'KeyN').ok, false, 'la pausa tampoco se muda de tecla');
assert.equal(cambiarTecla(base, 'pausa', 'Escape').ok, true, 'dejarla como está sí');
assert.equal(accionDeTecla(base, 'KeyH'), 'hacha');
assert.equal(accionDeTecla(base, 'KeyÑ'), null);
assert.equal(accionDeTecla(base, ''), null);
assert.equal(textoTecla('KeyW'), 'W');
assert.equal(textoTecla('Space'), 'Espacio');
assert.equal(textoTecla('ShiftLeft'), 'Shift');
assert.equal(textoTecla('F1'), 'F1');

// saneo de un mapa hecho puré
const roto = sanearMapaTeclas({ adelante: 'KeyI', mochila: 'KeyI', atras: 42, izquierda: 'banana', taller: 'KeyT', pausa: 'KeyW', pescar: 'KeyQ' });
assert.equal(roto.adelante, 'KeyI', 'la primera que agarró la tecla se la queda');
assert.notEqual(roto.mochila, 'KeyI', 'no quedan dos acciones con la misma tecla');
assert.equal(roto.atras, 'KeyS', 'la basura vuelve a lo de fábrica');
assert.equal(roto.izquierda, 'KeyA');
assert.equal(roto.taller, 'KeyT', 'un cambio válido se respeta');
assert.equal(roto.pausa, 'Escape', 'la pausa no se muda');
assert.equal('pescar' in roto, false, 'las acciones que no existen se tiran');
assert.deepEqual(Object.keys(roto).sort(), ACCIONES_TECLA.slice().sort(), 'el mapa sale completo');
assert.equal(new Set(Object.values(roto).filter(Boolean)).size, Object.values(roto).filter(Boolean).length, 'sin repetidas');
assert.deepEqual(sanearMapaTeclas(null), TECLAS_POR_DEFECTO, 'sin nada guardado, el de fábrica');
assert.deepEqual(sanearMapaTeclas('nada'), TECLAS_POR_DEFECTO);
assert.deepEqual(sanearMapaTeclas(mapaPorDefecto()), TECLAS_POR_DEFECTO);

// ------------------------------------------------------------------ tamaño de letra
assert.deepEqual(TAMANOS_LETRA.map((t) => t.id), ['normal', 'grande', 'enorme']);
assert.equal(escalaLetra('normal'), 1);
assert.ok(escalaLetra('grande') > 1 && escalaLetra('enorme') > escalaLetra('grande'), 'cada escalón agranda');
assert.equal(escalaLetra('inventado'), 1, 'un tamaño raro no achica nada');
assert.equal(siguienteTamano('normal'), 'grande');
assert.equal(siguienteTamano('enorme'), 'normal', 'el botón da la vuelta');

// ------------------------------------------------------------------ modo daltónico
for (const nombre of ['normal', 'protanopia', 'deuteranopia', 'tritanopia']) {
  const p = paleta(nombre);
  for (const rol of ['peligro', 'salud', 'aviso']) assert.match(p[rol], /^#[0-9a-f]{6}$/i, `${nombre}.${rol} no es un color`);
  assert.equal(new Set([p.peligro, p.salud, p.aviso]).size, 3, `en ${nombre} se repiten colores`);
}
assert.equal(paleta('cualquiera'), PALETAS.normal, 'una paleta desconocida cae en la normal');
assert.equal(colorDe('peligro', 'protanopia'), PALETAS.protanopia.peligro);
assert.equal(adaptarColor(PALETAS.normal.peligro, 'deuteranopia'), PALETAS.deuteranopia.peligro, 'el rojo del peligro cambia');
assert.equal(adaptarColor(PALETAS.normal.salud, 'protanopia'), PALETAS.protanopia.salud);
assert.equal(adaptarColor('#e0301e', 'normal'), '#e0301e', 'en normal no cambia nada');
assert.equal(adaptarColor('#123456', 'tritanopia'), '#123456', 'un color cualquiera se deja tranquilo');
assert.notEqual(PALETAS.protanopia.peligro, PALETAS.normal.peligro);

// ------------------------------------------------------------------ subtítulos
assert.equal(textoHora(20.5), '20:30');
assert.equal(textoHora(0), '00:00');
assert.equal(textoHora(7.25), '07:15');
let avisos = [];
for (let i = 1; i <= 6; i++) avisos = apilarAviso(avisos, { titulo: `Aviso ${i}`, texto: 'pasó algo', hora: 8 + i });
avisos = apilarAviso(avisos, null);
assert.equal(avisos.length, 6, 'un aviso vacío no entra');
const subs = subtitulos(avisos, 3);
assert.equal(subs.length, 3, 'salen los últimos tres');
assert.equal(subs[2].titulo, 'Aviso 6');
assert.equal(subs[0].hora, '12:00');
assert.equal(subs[0].linea, '[12:00] Aviso 4 — pasó algo');
assert.equal(subtitulos([{ titulo: 'Día 3', hora: 6 }], 2)[0].linea, '[06:00] Día 3', 'un aviso sin texto igual se escribe');
assert.deepEqual(subtitulos(null), [], 'sin avisos, lista vacía');
assert.equal(apilarAviso(avisos, { titulo: 'uno más' }, 3).length, 3, 'la lista no crece para siempre');

console.log('mando + accesibilidad: ok ·', ACCIONES_MANDO.length, 'acciones de joystick,', ACCIONES_TECLA.length, 'teclas remapeables,', Object.keys(PALETAS).length, 'paletas');
