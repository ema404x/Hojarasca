// 1.6: la calidad automática. El juego mide los cuadros de verdad y sube o baja solo.
import assert from 'node:assert/strict';
import {
  NIVELES_CALIDAD, NOMBRE_CALIDAD, AJUSTES_AUTOCALIDAD, crearEstadoAutocalidad, anotarCuadro,
  fpsMedio, fpsPeor, resumenFps, decidirCalidad, aplicarCambio, revisarCalidad, reiniciarMedicion,
  sincronizarCalidad, calidadVecina, indiceCalidad, avisoCalidad, segundosParaSubir, textoFps,
} from '../src/autocalidad.js';

// Corre `segundos` de juego a `fps` parejos y devuelve el estado.
function correr(estado, segundos, fps) {
  const dt = 1 / fps;
  for (let t = 0; t + dt <= segundos + 1e-9; t += dt) anotarCuadro(estado, dt);
  return estado;
}
// Foto de lo que mira la decisión, para chequear que no la ensucie.
const foto = (e) => JSON.stringify([e.calidad, e.rojo, e.verde, e.desdeCambio, e.calentando, e.llenas, e.bajadas, e.subidas]);

// los escalones son los mismos que en config.js y guardado.js
assert.deepEqual(NIVELES_CALIDAD, ['muybaja', 'baja', 'media', 'alta']);
assert.equal(indiceCalidad('media'), 2);
assert.equal(indiceCalidad('altisima'), -1);
assert.equal(calidadVecina('media', -1), 'baja');
assert.equal(calidadVecina('media', 1), 'alta');
assert.equal(calidadVecina('muybaja', -1), null, 'abajo de muybaja no hay nada');
assert.equal(calidadVecina('alta', 1), null, 'arriba de alta tampoco');
assert.equal(NOMBRE_CALIDAD.muybaja, 'Mínima');

// ------------------------------------------------------------------ medición
const m = crearEstadoAutocalidad('media');
correr(m, 30, 60);
assert.ok(Math.abs(fpsMedio(m) - 60) < 0.5, 'a 60 fps la media da 60');
assert.ok(Math.abs(fpsPeor(m) - 60) < 0.5, 'si todos los cuadros son iguales, el peor también');
assert.equal(decidirCalidad(m), null, 'a 60 fps parejos no se toca nada');
assert.equal(m.calidad, 'media');
assert.ok(resumenFps(m).listo);
assert.match(textoFps(m), /^60 fps · 5% peor 60 · calidad Media$/);

// el 5% peor caza los tirones aunque el promedio cierre lindo
const t = crearEstadoAutocalidad('media');
correr(t, 10, 60);                                     // la ventana ya está llena de cuadros lindos
for (let i = 0; i < 9; i++) anotarCuadro(t, 1 / 12);   // y ahora entran unos pocos feos
assert.ok(fpsMedio(t) > 40, 'el promedio casi no se entera');
assert.ok(fpsPeor(t) < 20, 'pero el 5% peor sí');

// cuadros absurdos: pausa, alt+tab o una carga no son rendimiento
const f = crearEstadoAutocalidad('media');
const antes = f.llenas;
anotarCuadro(f, 3);
anotarCuadro(f, NaN);
anotarCuadro(f, -1);
assert.equal(f.llenas, antes);
assert.equal(f.frenos, 1, 'sólo el freno de 3 s cuenta como freno');

// ------------------------------------------------------------------ bajar
const b = crearEstadoAutocalidad('media');
correr(b, 4, 25);
assert.equal(decidirCalidad(b), null, 'los primeros segundos después de cargar no cuentan');
correr(b, 6, 25);
const foto1 = foto(b);
const baja = decidirCalidad(b);
assert.equal(foto(b), foto1, 'decidirCalidad no toca el estado');
assert.ok(baja, 'a 25 fps sostenidos hay que bajar');
assert.equal(baja.motivo, 'bajar');
assert.deepEqual([baja.desde, baja.hasta], ['media', 'baja'], 'un escalón por vez');
assert.ok(baja.fps.medio < 30);
aplicarCambio(b, baja);
assert.equal(b.calidad, 'baja');
assert.equal(b.bajadas, 1);
assert.equal(b.llenas, 0, 'después del cambio la ventana arranca limpia');

// no baja dos veces seguidas: hay tiempo de gracia y calentamiento
correr(b, 3, 25);
assert.equal(decidirCalidad(b), null, 'recién cambiamos, hay que dejarlo asentar');
correr(b, 10, 25);
const baja2 = decidirCalidad(b);
assert.ok(baja2 && baja2.hasta === 'muybaja', 'pasada la gracia, si sigue sufriendo baja otro escalón');
aplicarCambio(b, baja2);
assert.equal(b.bajadas, 2);

// en muybaja ya no hay a dónde bajar
correr(b, 25, 20);
assert.equal(decidirCalidad(b), null, 'en muybaja no se baja más');
assert.equal(b.calidad, 'muybaja');

// y el contador corta el rebote aunque quede escalón libre
const tope = crearEstadoAutocalidad('alta', { bajadasMaximas: 1 });
correr(tope, 12, 25);
aplicarCambio(tope, decidirCalidad(tope));
assert.equal(tope.calidad, 'media');
correr(tope, 20, 25);
assert.equal(decidirCalidad(tope), null, 'con una bajada ya hecha, el tope la frena');

// ------------------------------------------------------------------ subir
const s = crearEstadoAutocalidad('media');
correr(s, 10, 140);
assert.equal(decidirCalidad(s), null, 'para subir pedimos más paciencia que para bajar');
correr(s, 10, 140);
const sube = decidirCalidad(s);
assert.ok(sube, 'a 140 fps sobra máquina');
assert.deepEqual([sube.motivo, sube.desde, sube.hasta], ['subir', 'media', 'alta']);
aplicarCambio(s, sube);
assert.equal(s.subidas, 1);
correr(s, 30, 140);
assert.equal(decidirCalidad(s), null, 'en alta no se sube más');

// ------------------------------------------------------------------ histéresis
const h = crearEstadoAutocalidad('media');
correr(h, 6, 60);              // calentamiento y un rato tranquilo
correr(h, 2, 25);              // un bajón corto
assert.ok(h.rojo > 1 && h.rojo < AJUSTES_AUTOCALIDAD.segundosBajar, 'suma, pero todavía no alcanza');
assert.equal(decidirCalidad(h), null, 'un bajón suelto no cambia la calidad');
correr(h, 10, 70);             // vuelve a la zona muerta: lo acumulado se afloja
assert.equal(h.rojo, 0, 'entre los dos objetivos el rojo se va solo');
assert.equal(h.verde, 0, 'y el verde tampoco crece en la zona muerta');
assert.equal(decidirCalidad(h), null);

// después de rebotar, subir cuesta el doble
const r = crearEstadoAutocalidad('media');
assert.equal(segundosParaSubir(r), AJUSTES_AUTOCALIDAD.segundosSubir);
r.subidas = 1;
aplicarCambio(r, { motivo: 'bajar', hasta: 'baja' });
assert.equal(r.rebotes, 1, 'bajar después de haber subido es un rebote');
assert.equal(segundosParaSubir(r), AJUSTES_AUTOCALIDAD.segundosSubir * 2);

// ------------------------------------------------------------------ avisos
const aBaja = avisoCalidad('alta', 'media');
assert.equal(aBaja.titulo, 'Calidad automática');
assert.equal(aBaja.texto, 'Bajé la calidad a Media para que vaya más fluido. Lo podés cambiar a mano en Ajustes.');
assert.match(avisoCalidad('baja', 'muybaja').texto, /^Bajé la calidad a Mínima: es lo más liviano/);
assert.equal(avisoCalidad('media', 'alta').texto, 'Subí la calidad a Alta: tu máquina daba de sobra.');
assert.match(avisoCalidad('muybaja', 'baja').texto, /^Subí la calidad a Baja/);
assert.equal(baja.aviso.texto, avisoCalidad('media', 'baja').texto, 'el cambio trae su propio avisito');

// ------------------------------------------------------------------ manijas del bucle
const v = crearEstadoAutocalidad('media');
let cambios = 0;
for (let i = 0; i < 25 * 30; i++) if (revisarCalidad(v, 1 / 25)) cambios++;
assert.equal(cambios, 2, 'en 30 s de 25 fps baja dos escalones, nunca de a dos juntos');
assert.equal(v.calidad, 'muybaja');

const p = crearEstadoAutocalidad('media');
correr(p, 20, 25);
reiniciarMedicion(p, 4);       // cargó una zona nueva: los picos de carga no cuentan
assert.equal(p.llenas, 0);
assert.equal(decidirCalidad(p), null);
sincronizarCalidad(p, 'alta'); // el jugador la tocó a mano
assert.equal(p.calidad, 'alta');
assert.equal(p.bajadas, 0, 'lo que toca el jugador no cuenta como bajada nuestra');
p.activa = false;
correr(p, 30, 20);
assert.equal(decidirCalidad(p), null, 'apagada, la autocalidad no opina');

console.log('autocalidad: ok · baja bajo', AJUSTES_AUTOCALIDAD.fpsBajar, 'fps, sube arriba de', AJUSTES_AUTOCALIDAD.fpsSubir, '· gracia', AJUSTES_AUTOCALIDAD.gracia, 's');
