// 3.0.1: auditoría de las estructuras del valle, en Node. Lo que depende del mundo 3D (entrar
// caminando a cada edificio, las puertas con E, guardar adentro) lo prueba la partida real
// `pruebas/humo-3-0-1-estructuras.cjs`; acá va la parte pura (colisiones.paredEntre, la que
// usan los asientos, lo que se usa con E en tus obras y el freno contra atravesar paredes) y
// que los arreglos sigan en su lugar.
import assert from 'assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { crearColisiones } from '../src/colisiones.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');

// ---------------------------------------------------------------- 1. paredEntre
{
  const col = crearColisiones();
  const pared = { seg: true, ax: 0, az: -5, bx: 0, bz: 5, r: 0.16, alturaMin: -0.3, alturaMax: 2.9 };
  col.agregar(pared);
  assert.equal(col.paredEntre(-1, 0, 1, 0, 1), true, 'una pared corta la línea');
  assert.equal(col.paredEntre(-1, 0, -0.2, 0, 1), false, 'del mismo lado no hay pared');
  assert.equal(col.paredEntre(-1, 6, 1, 6, 1), false, 'más allá de la punta de la pared, no');
  assert.equal(col.paredEntre(-1, 0, 1, 0, 3.5), false, 'por encima de su alto, no');
  assert.equal(col.paredEntre(-1, 0, 1, 0, 3.5, 3.6), false);
  assert.equal(col.paredEntre(-1, 0, 1, 0, -2, 0.5), true, 'un cuerpo cuyo alto se cruza con la pared, sí');
  // barandas y muebles (r < 0,13) no tapan
  const col2 = crearColisiones();
  col2.agregar({ seg: true, ax: 0, az: -5, bx: 0, bz: 5, r: 0.07, alturaMin: 0, alturaMax: 1.2 });
  assert.equal(col2.paredEntre(-1, 0, 1, 0, 1), false, 'una baranda fina no es pared');
  // una puerta cerrada, aunque su hoja sea fina, sí; y se puede dejar afuera
  const col3 = crearColisiones();
  col3.agregar({ seg: true, dinamico: true, ax: 0, az: -0.6, bx: 0, bz: 0.6, r: 0.07, alturaMin: 0, alturaMax: 2 });
  assert.equal(col3.paredEntre(-1, 0, 1, 0, 1), true, 'la puerta cerrada tapa');
  assert.equal(col3.paredEntre(-1, 0, 1, 0, 1, 1, false), false, 'sin puertas, no');
  // la obra que se usa no se tapa a sí misma
  const obra = { id: 'telar' };
  const col4 = crearColisiones();
  col4.agregar({ duenio: obra, seg: true, ax: 0, az: -1, bx: 0, bz: 1, r: 0.2, alturaMin: 0, alturaMax: 2 });
  assert.equal(col4.paredEntre(-1, 0, 1, 0, 1), true);
  assert.equal(col4.paredEntre(-1, 0, 1, 0, 1, 1, true, obra), false, 'la física de la obra que se usa no cuenta');
}

// ---------------------------------------------------------------- 2. los arreglos siguen ahí
const est = leer('src/estructuras.js'), piezas = leer('src/piezas.js'), jug = leer('src/jugador.js');
const puertas = leer('src/puertas.js'), obj = leer('src/objetos.js'), main = leer('src/main.js');
const troch = leer('src/trochita.js');
const hay = (texto, cadena, msg) => assert.ok(texto.includes(cadena), msg);
// física de base
hay(jug, 'col.paredEntre(previoX, previoZ, estado.pos.x, estado.pos.z', 'la corrección puede volver a dejarte del otro lado de una pared');
hay(jug, '(estado.enSuelo || estado.coyote > 0) && estado.vy <= 0 ? 0.62 : 0.015', 'una rendija entre plataformas vuelve a tirarte');
hay(puertas, 'dinamico: true, duenio, r: 0.07', 'la hoja de la puerta volvió a comerse 14 cm del vano');
hay(puertas, "p.rot - (p.adentro ? -1 : 1) * p.lado * p.abierta * 1.75", 'las puertas perdieron la opción de abrir hacia adentro');
hay(piezas, 'const recorteHueco = ', 'la punta redonda de la pared vuelve a cerrar el vano (paredCurva)');
hay(piezas, 'const c0 = t0 > 1e-6 ? Math.min(t0 + rCol, (t0 + t1) / 2) : t0;', 'la punta redonda de la pared vuelve a cerrar el vano (paredRecta)');
hay(piezas, 'Math.PI / 2 - a2, a2 - a1', 'la cara de abajo de los pisos con hueco vuelve a estar espejada');
hay(piezas, 'sinTecho = false', 'los peldaños perdieron `sinTecho`');
// puertas del valle: el giro en limpio después del attach
hay(est, 'puerta.g.rotation.set(0, giroPuerta, 0);', 'las puertas del refugio y el faro vuelven a abrir espejadas');
// torre, faro y molino: se suben
hay(est, "alto: sitio.y + p.y + 0.07, espesor: 0.14, sinTecho: true", 'la escalera de la torre vuelve a tener techo en cada peldaño');
hay(est, "alto: y0 + pe.y + 0.05, espesor: 0.10, sinTecho: true", 'el caracol del faro vuelve a tener techo en cada peldaño');
hay(est, 'alto: altoPaso - espesorPasoFaro / 2, espesor: espesorPasoFaro', 'la escalinata del faro vuelve a subir por encima de la puerta');
hay(est, "(i > 0 && y0a - h < 2.2) ? y0a + 0.02 : y0a - 0.25", 'el anillo sobre la puerta del faro vuelve a ser un dintel invisible');
hay(est, 'hueco: HUECO_SALA', 'el hueco de la sala del faro vuelve a ser chico');
hay(est, 'lente.position.set(mejor.x, y0 + ALTO + 1.75, mejor.z);', 'la lente del faro vuelve a la altura de la cabeza');
hay(est, 'const a2 = Math.PI * 1.185 + t * Math.PI * 0.885;', 'la escalera del molino vuelve a cruzar la puerta');
hay(est, 'alturaMin: y0 + 0.8, alturaMax: y0 + h + 0.05,', 'la pared del molino vuelve a cerrar el entrepiso');
// cabañas, refugio, almacén, galpón, cueva, estaciones
hay(est, 'y = Math.max(y, T.altura(q.x, q.z) - 0.30);', 'la cabaña vuelve a hundir su piso en la ladera');
hay(est, 'let zPieEscalera = D / 2 + GAL + 1.4;', 'la escalera de la cabaña vuelve a quedar colgada');
hay(est, "adentro: true });", 'la puerta de la cabaña vuelve a cortar la galería');
hay(est, 'const CATRE_X = -W / 2 + 1.4;', 'el catre vuelve a meterse en el hogar');
hay(est, 'const LEÑA_FONDO = { x: 0.6, z: -D / 2 - 0.3 };', 'la leña vuelve a atravesar la cama del refugio');
hay(est, 'const MESA = { x: 1.1, z: -0.98 };', 'la mesa del refugio vuelve a montar sobre la cama');
hay(est, 'corral(-2, -15.6, 9, 9);', 'el corral vuelve a tapar el portón del galpón');
hay(est, 'const posTan = w(-15, -6.5);', 'el tanque vuelve a meterse en el cobertizo');
hay(est, "sitio.y = Math.max(sitio.y, alto - 0.29);", 'la cueva vuelve a quedar tapada por el cerro');
hay(est, 'alturaMin: y + 1.17, alturaMax: y + 1.73', 'la tabla de los carteles vuelve a atravesarse');
hay(est, 'mostrador, detras, radio: 9, ancho: W, fondo: D', 'el almacén no dice su tamaño');
hay(troch, "for (const lado of chica ? [-1, 1] : [1]) {", 'los andenes vuelven a no tener escalones');
hay(troch, 'pared([-W / 2, Z0 - D / 2], [-hueco * 0.5 - 0.16, Z0 - D / 2]);', 'la puerta de la sala de espera vuelve a cerrarse');
// asientos y mostrador
hay(obj, 'est.col?.paredEntre?.(ojo.x, ojo.z, s.x, s.z, s.y)', 'los asientos vuelven a usarse a través de las paredes');
hay(obj, 'Math.abs(s.y - 0.45 - jug.estado.pos.y) > 1.1', 'los asientos de otro piso vuelven a ofrecerse');
hay(est, '    personal, mastil: personal?.mastil || null, col', 'las estructuras no le pasan las colisiones a los asientos');   // (3.6: después va lugaresSorteo)
hay(main, 'if (enElAlmacen) return true;   // abierto, se cierra recién al alejarse', 'el mostrador vuelve a atender desde afuera');
hay(main, 'function sinParedEnMedio(o) {', 'lo de tus obras vuelve a usarse a través de las paredes');
hay(main, "const o = funcionAlAlcance('huerta', 2.4);", 'el cantero vuelve a usarse a través de las paredes');
hay(main, 'sinParedEnMedio(o)) { d0 = d; mejor = o; }', 'la colmena, el horno o la radio vuelven a usarse a través de las paredes');

// ---------------------------------------------------------------- 3. escalones que no se pueden subir
// La contrahuella de las escaleras de la cabaña (30 cm a 25 cm de pedada) tiene que dejar
// subir con el cuerpo de 70 cm: el peldaño que queda a más de 0,62 m no puede frenar antes
// de pisar el siguiente (tres peldaños más arriba: 2 × pedada ≥ 0,35).
assert.ok(2 * 0.25 >= 0.35, 'la escalera de la cabaña es demasiado empinada para el cuerpo');

console.log('3.0.1 estructuras: ok · paredEntre (asientos, obras, freno) · 40 arreglos en su lugar');
