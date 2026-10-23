// 4.10 «Volver a jugar», tanda del Coihue y el valle (sin Electron):
//   1. el Coihue camina hacia tu base en el asedio: la ruta (válida, sin agua ni obras ni vía), el avance de cada noche, cuándo
//      llega, cómo se lo frena (raíces heridas, trampas), lo que se guarda y lo que se muestra;
//   2. la subida con peligros: las raíces que se mueven (ciclo con aviso, barrido, tapa y vuelta; sólo cuando estás cerca; nunca
//      te dejan encerrado) y los duendes de las ramas;
//   3. los lugares del valle que toman los duendes: cómo se toman, cómo se recuperan, qué afectan y que se guardan saneados;
//   4. el enganche con el resto del juego (que no se puede importar en Node: se mira el texto).
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {
  CAMINO, largoRuta, puntoEnRuta, rutaDelCoihue, rutaRecta, caminoNuevo, sanearCamino, posicionCamino, metrosABase, ritmoCamino,
  enVentana, horasDeNoche, empezarNocheCamino, tickCamino, cerrarNocheCamino, herirPies, pisarTrampa, textoCamino, rutaRestante,
  marcasCamino, anotarRastro, faltaCamino, trabado, RASTRO_MAX,
} from '../src/desafio-camino.js';
import {
  asedioNuevo, sanearAsedio, textoAsedio, marcasAsedio, puedeAbordar, zonasLibres, danarAncla, ASEDIO,
} from '../src/desafio-asedio.js';
import {
  PELIGROS, periodoRaiz, faseRaiz, avanzarRaiz, posicionBarrido, salidaRaiz, raizSolida, barridoTeAgarra, lugaresRaices,
} from '../src/desafio-nave.js';
import {
  TOMADAS, valleNuevo, sanearValle, zonasTomadasDelValle, tomarAlAmanecer, nidosDeZona, lugarNidoDeZona, extraDeZona,
  abrirseNidoDeZona, sacaronNidoDeZona, cerrarValle, tomadaEn, marcasValle, nombreTomada, defTomada,
} from '../src/desafio-valle.js';
import { CAPULLOS, sanearCapullos } from '../src/desafio-infestacion.js';
import { sanearDesafio, desafioNuevo, NOCHE_FINAL, NOCHE_JEFE, HORA_ATAQUE } from '../src/desafio-reglas.js';
import { marcasAutomaticas } from '../src/chinches.js';
import { enUnaLinea } from './ayuda-codigo.mjs';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const cerca = (a, b, tol, m) => ok(Math.abs(a - b) <= tol, `${m} (${a} vs ${b})`);
const azarFijo = (semilla = 7) => { let s = semilla; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; };

// ---------------------------------------------------------------- 1. la ruta
// Un mundo de mentira: una laguna, un cerco de obras con un hueco, y la base en el origen.
const laguna = (x, z) => Math.hypot(x - 40, z - 10) < 22;
const obra = (x, z) => Math.abs(x - 20) < 3 && Math.abs(z) < 30 && !(z > 14 && z < 22);   // pared de 60 m con una puerta de 8
const libre = (x, z) => !laguna(x, z) && !obra(x, z);
const BASE = { x: 0, z: 0 };
{
  const desde = { x: 75, z: 4 };
  const ruta = rutaDelCoihue(desde, BASE, libre, {});
  ok(Array.isArray(ruta) && ruta.length >= 3, 'hay ruta, y rodea (más de una recta)');
  eq(ruta[0], [75, 4], 'arranca donde está parado');
  const fin = ruta[ruta.length - 1];
  ok(Math.hypot(fin[0], fin[1]) <= CAMINO.llegada + CAMINO.celda, `termina a la distancia de llegada (${Math.hypot(fin[0], fin[1]).toFixed(1)} m)`);
  // cada metro de cada tramo es libre: no cruza el agua ni la pared
  let malo = 0;
  for (let i = 1; i < ruta.length; i++) {
    const l = Math.hypot(ruta[i][0] - ruta[i - 1][0], ruta[i][1] - ruta[i - 1][1]);
    for (let k = 0; k <= l; k += 1) { const t = l ? k / l : 0; if (!libre(ruta[i - 1][0] + (ruta[i][0] - ruta[i - 1][0]) * t, ruta[i - 1][1] + (ruta[i][1] - ruta[i - 1][1]) * t)) malo++; }
  }
  eq(malo, 0, 'ningún punto de la ruta cae en el agua ni en una obra');
  ok(largoRuta(ruta) > Math.hypot(75, 4) - CAMINO.llegada, 'es más larga que la recta (rodea la laguna y la pared)');
  ok(ruta.length <= CAMINO.puntosMax, 'pocos puntos (se guarda con la partida)');
  // si no hay obstáculos, es casi la recta
  const rect = rutaDelCoihue(desde, BASE, () => true, {});
  ok(largoRuta(rect) < Math.hypot(75, 4) - CAMINO.llegada + 8, 'sin nada en el medio, casi derecho');
  // la costa del lago pesa: con un costo alto en una franja, la esquiva si puede
  const conCosto = rutaDelCoihue({ x: 80, z: 0 }, BASE, () => true, { costo: (x, z) => (Math.abs(z) < 6 && x > 30 && x < 60 ? 5 : 0) });
  ok(conCosto.every(([x, z]) => !(Math.abs(z) < 5 && x > 33 && x < 57)) || largoRuta(conCosto) > 55, 'el costo (monte, ladera) la desvía');
  // sin camino: null; y la recta de respaldo
  const encerrado = rutaDelCoihue(desde, BASE, (x, z) => Math.hypot(x - 75, z - 4) < 4 || Math.hypot(x, z) < 20, {});
  ok(encerrado === null, 'encerrado del todo: no hay ruta (el juego usa la recta)');
  const r = rutaRecta(desde, BASE);
  eq(r.length, 2, 'la recta son dos puntos');
  cerca(Math.hypot(r[1][0], r[1][1]), CAMINO.llegada, 0.2, 'la recta termina a la distancia de llegada');
  ok(rutaRecta({ x: 5, z: 0 }, BASE).every(([x]) => x === 5), 'ya llegó: la recta no se mueve');
  ok(puntoEnRuta(ruta, 0).x === 75 && puntoEnRuta(ruta, 1e9).x === fin[0], 'puntoEnRuta se acota a los extremos');
  const p = puntoEnRuta(ruta, 10);
  cerca(Math.hypot(p.dx, p.dz), 1, 1e-6, 'y da hacia dónde va');
  ok(largoRuta([]) === 0 && puntoEnRuta([], 3) === null, 'una ruta vacía no rompe');
  // determinista
  eq(rutaDelCoihue(desde, BASE, libre, {}), ruta, 'la misma entrada da la misma ruta');
  // un mapa enorme no se cuelga
  ok(rutaDelCoihue({ x: -1e5, z: 0 }, BASE, () => true, { margen: 70 }) === null, 'un mapa gigante se rechaza (sin colgarse)');
}

// ---------------------------------------------------------------- 1b. el avance por noche
function nuevoCamino(largoX = 62, interior = { x: 62, z: 0 }) {
  const ruta = rutaDelCoihue({ x: largoX, z: 0 }, BASE, () => true, {});
  return caminoNuevo({ ruta, base: BASE, interior });
}
// Una noche entera (en pasos de 6 minutos de juego) con `libres` zonas libres; devuelve los metros caminados.
function noche(c, libres = 0, antes = null) {
  empezarNocheCamino(c, 5);
  let m = 0;
  for (let hn = 0; hn < 9.5; hn += 0.1) {
    if (antes) antes(c, hn);
    m += tickCamino(c, hn, libres).avance;
  }
  cerrarNocheCamino(c, libres);
  return m;
}
{
  const c = nuevoCamino();
  ok(c.largo > 30 && c.largo < 45, `la ruta del ejemplo mide ${c.largo.toFixed(1)} m`);
  eq(c.porNoche, Math.max(CAMINO.minimoNoche, Math.round(c.largo / CAMINO.noches * 10) / 10), 'el paso de cada noche: en CAMINO.noches llegaría');
  ok(!c.llego && c.d === 0 && c.noche === -1, 'arranca quieto y sin llegar');
  // horas de noche
  cerca(horasDeNoche(HORA_ATAQUE), 0, 1e-9, '20:30 es el cero de la noche');
  cerca(horasDeNoche(0), 3.5, 1e-9, 'la medianoche, a las 3,5 h');
  cerca(horasDeNoche(5.99), 9.49, 1e-6, 'la última luz, a las 9,5');
  ok(enVentana(0.6) && enVentana(6.4) && !enVentana(0.2) && !enVentana(6.6) && !enVentana(9), 'camina sólo en su ventana (de 0,5 a 6,5 h de la noche)');
  const m1 = noche(c, 0);
  cerca(m1, c.porNoche, 0.05, 'una noche sin zonas libres: lo que dice porNoche');
  cerca(c.d, m1, 1e-9, 'y la distancia recorrida lo guarda');
  ok(c.noche === -1 && c.ultima === -1 && c.caminadas === 1, 'al amanecer se cierra la noche');
  // más zonas libres, más despacio; con el piso
  const a = nuevoCamino(), b = nuevoCamino(), z = nuevoCamino();
  const sin = noche(a, 0), con2 = noche(b, 2), con4 = noche(z, 4);
  ok(con2 < sin && con4 < con2, `cuantas más zonas libres, menos camina (${sin.toFixed(1)} → ${con2.toFixed(1)} → ${con4.toFixed(1)})`);
  cerca(con4 / sin, Math.max(CAMINO.pisoRitmo, 1 - CAMINO.porZonaLibre * 4), 0.02, 'la rebaja es la de las zonas libres');
  ok(con4 / sin >= CAMINO.pisoRitmo - 1e-6, 'nunca baja del piso del ritmo');
  ok(ritmoCamino(c, 99) / ritmoCamino(c, 0) >= CAMINO.pisoRitmo - 1e-9, 'ni con muchas zonas libres');
  // llega en las noches que dice, y no se pasa
  const q = nuevoCamino();
  let noches = 0;
  while (!q.llego && noches < 30) { noche(q, 0); noches++; }
  ok(q.llego && noches >= CAMINO.noches && noches <= CAMINO.noches + 1, `sin ayuda llega en ${noches} noches (las ${CAMINO.noches} de siempre, o una más por el redondeo)`);
  cerca(q.d, q.largo, 1e-9, 'y queda exactamente al final de la ruta');
  cerca(metrosABase(q), Math.max(0, Math.hypot(posicionCamino(q).x, posicionCamino(q).z) - q.llegada), 1e-6, 'metrosABase mide en recta');
  ok(tickCamino(q, 3, 0).avance === 0 && q.d === q.largo, 'una vez que llegó no se mueve más');
  // dormir: sin cuadros intermedios, cerrar la noche camina lo que faltaba
  const s = nuevoCamino();
  empezarNocheCamino(s, 3);
  const r = cerrarNocheCamino(s, 0);
  cerca(r.avance, s.porNoche, 0.05, 'una noche dormida de corrido camina igual');
  // dormir a medias: el reloj salta de la hora 2 a la 9
  const t = nuevoCamino();
  empezarNocheCamino(t, 3);
  let dado = tickCamino(t, 2, 0).avance;
  dado += tickCamino(t, 9, 0).avance;
  dado += cerrarNocheCamino(t, 0).avance;
  cerca(dado, t.porNoche, 0.05, 'un salto de reloj a la mitad no regala ni quita');
  // el reloj que vuelve para atrás (cambió la hora) no camina ni rompe
  const u = nuevoCamino();
  empezarNocheCamino(u, 3); tickCamino(u, 4, 0);
  const antes = u.d;
  tickCamino(u, 1, 0);
  ok(u.d === antes, 'un reloj que vuelve atrás no camina de más');
  // ya llegado de entrada
  const l0 = caminoNuevo({ ruta: [[10, 0], [10, 0]], base: BASE, interior: { x: 10, z: 0 } });
  ok(l0.llego && l0.largo === 0, 'si ya estaba en la base, llegó');
  eq(caminoNuevo({ ruta: [[1, 1]], base: BASE, interior: BASE }), null, 'sin ruta no hay camino');
}

// ---------------------------------------------------------------- 1c. frenarlo
{
  // raíces heridas de noche: a los golpes necesarios se traba (y no más de lo que aguanta)
  const c = nuevoCamino();
  empezarNocheCamino(c, 5);
  tickCamino(c, 1, 0);
  let r = herirPies(c, CAMINO.vidaPies - 1, { deNoche: true });
  ok(r.ok && !r.corte && c.atasco === 0, 'un poco de daño no la traba');
  r = herirPies(c, 5, { deNoche: true });
  ok(r.corte && c.atasco === CAMINO.atascoCorte && c.inmune === CAMINO.inmune && c.cortes === 1, 'al llegar al daño de una raíz se traba y queda inmune un rato');
  ok(trabado(c), 'trabado');
  r = herirPies(c, 9999, { deNoche: true });
  ok(r.inmune && !r.corte && c.atasco === CAMINO.atascoCorte, 'inmune: pegar de más no lo clava para siempre');
  // trabado, no camina; cuando se libera, sigue
  const dTrab = c.d;
  const camina = tickCamino(c, 1.1, 0);
  ok(!camina.camina && c.d === dTrab, 'trabado no avanza');
  tickCamino(c, 2.0, 0);
  ok(c.atasco === 0 && !trabado(c), 'y se libera con las horas');
  tickCamino(c, 3.0, 0);
  ok(c.d > dTrab, 'y vuelve a caminar');
  // la vida de la dificultad cambia el daño necesario
  const v = nuevoCamino(); empezarNocheCamino(v, 1);
  ok(!herirPies(v, CAMINO.vidaPies * 1.2, { deNoche: true, vida: 2 }).corte && herirPies(v, CAMINO.vidaPies * 0.9, { deNoche: true, vida: 2 }).corte, 'con más vida hace falta más daño');
  ok(!herirPies(nuevoCamino(), 0, {}).ok && !herirPies(nuevoCamino(), -5, {}).ok && !herirPies(null, 5, {}).ok, 'un golpe sin daño o sin camino no hace nada');
  // el tope de lo quieto
  const k = nuevoCamino(); empezarNocheCamino(k, 1);
  for (let i = 0; i < 20; i++) { k.inmune = 0; herirPies(k, 9999, { deNoche: true }); pisarTrampa(k); }
  ok(k.atasco <= CAMINO.atascoMax + 1e-9, 'lo máximo que se le puede acumular quieto está acotado');
  // frenado todo lo posible: el mejor caso sigue avanzando (no se lo detiene para siempre)
  const lento = nuevoCamino();
  const mejor = noche(lento, 4, (cc, hn) => { if (hn > 0.4 && hn < 6.6) herirPies(cc, 9999, { deNoche: true }); });
  const libre0 = noche(nuevoCamino(), 4);
  ok(mejor < libre0 && mejor > 0, `pegándole todo lo que se pueda camina menos pero camina (${libre0.toFixed(1)} → ${mejor.toFixed(1)} m)`);
  ok(mejor >= libre0 * 0.3 && mejor <= libre0 * 0.7, `y no se lo frena por completo (queda entre el 30% y el 70%: ${(100 * mejor / libre0).toFixed(0)}%)`);
  // trampa: lo enreda
  const tr = nuevoCamino(); empezarNocheCamino(tr, 1); tickCamino(tr, 1, 0);
  ok(pisarTrampa(tr) && tr.atasco === CAMINO.atascoTrampa, 'una trampa lo enreda un rato');
  const conTrampa = noche(nuevoCamino(), 0, (cc, hn) => { if (Math.abs(hn - 1) < 0.05 && cc.atasco === 0) pisarTrampa(cc); });
  ok(conTrampa < noche(nuevoCamino(), 0) - 0.5, 'y camina menos esa noche');
  // de día: las raíces cortadas rebajan la noche que viene
  const dia = nuevoCamino();
  ok(herirPies(dia, CAMINO.vidaPies + 1, { deNoche: false }).corte && dia.rebaja === CAMINO.rebajaDia && dia.atasco === 0, 'de día un corte no traba: rebaja el paso de la noche');
  for (let i = 0; i < 6; i++) herirPies(dia, CAMINO.vidaPies + 1, { deNoche: false });
  ok(dia.rebaja <= CAMINO.rebajaMax + 1e-9, 'la rebaja de día tiene tope');
  const rebajada = noche(dia, 0);
  ok(rebajada < nuevoCamino().porNoche - 0.5, 'esa noche camina menos');
  ok(dia.rebaja === 0, 'y la rebaja se gasta en esa noche');
  // llegó: ya no hay a quién pegarle
  const ll = nuevoCamino(); ll.llego = true;
  ok(!herirPies(ll, 999, {}).ok && !pisarTrampa(ll), 'llegado, nada lo frena');
}

// ---------------------------------------------------------------- 1d. el asedio con camino: guardado, textos, mapa
function asedioConCamino() {
  const zonas = [{ id: 'base', x: 0, z: 40 }, { id: 'estacion', x: 200, z: 0 }, { id: 'lago', x: -150, z: 90 }, { id: 'bosque', x: 60, z: -220 }];
  const a = asedioNuevo(zonas, { x: 62, z: 0 }, 600);
  a.camino = nuevoCamino();
  return a;
}
{
  const a = asedioConCamino();
  const s = sanearAsedio(JSON.parse(JSON.stringify(a)));
  eq(s.camino, a.camino, 'el camino viaja con el guardado, entero');
  eq(s.nave, { x: 62, z: 0 }, 'la nave es donde está el camino');
  // caminó: la nave sigue al camino aunque lo guardado diga otra cosa
  a.camino.d = 12;
  a.nave = { x: 1, z: 1 };
  const p = posicionCamino(a.camino);
  const s2 = sanearAsedio(JSON.parse(JSON.stringify(a)));
  cerca(s2.nave.x, Math.round(p.x * 10) / 10, 0.11, 'una nave desfasada se pone donde dice el camino');
  // una partida de antes: sin camino
  const vieja = sanearAsedio({ nave: { x: 5, z: 6 }, zonas: [{ id: 'lago', x: 1, z: 2 }] });
  ok(vieja && !('camino' in vieja), 'un asedio de antes carga sin camino');
  // un camino roto se descarta (y el asedio se queda)
  for (const roto of [null, 'x', 5, [], {}, { ruta: 3 }, { ruta: [[1, 2]] }, { ruta: [['a', 'b'], ['c', 'd']], base: BASE, interior: BASE }, { ruta: [[0, 0], [5, 5]], base: null, interior: BASE }, { ruta: [[0, 0], [5, 5]], base: BASE, interior: { x: 'q', z: 1 } }]) {
    eq(sanearCamino(roto), null, `un camino roto se descarta: ${JSON.stringify(roto)}`);
  }
  const conBasura = sanearAsedio({ ...JSON.parse(JSON.stringify(a)), camino: { ...JSON.parse(JSON.stringify(a.camino)), d: 'mucho', atasco: 1e9, rebaja: -5, heridas: NaN, porNoche: 'x', noche: 1e12, ultima: 'x', cerco: 1, rastro: [1, [2], ['a', 3], [4, 5]] } });
  const cb = conBasura.camino;
  ok(cb.d === 0 && cb.atasco === CAMINO.atascoMax && cb.rebaja === 0 && cb.heridas === 0 && cb.porNoche === CAMINO.minimoNoche && cb.ultima === -1, 'los números rotos vuelven a su lugar');
  ok(cb.cerco === true && cb.rastro.length === 1 && cb.rastro[0][0] === 4, 'el rastro se queda sólo con puntos buenos');
  const mucho = sanearCamino({ ...JSON.parse(JSON.stringify(a.camino)), ruta: Array.from({ length: 5000 }, (_, i) => [i, 0]), rastro: Array.from({ length: 5000 }, (_, i) => [i, 0]) });
  ok(mucho.ruta.length === CAMINO.puntosMax && mucho.rastro.length === RASTRO_MAX, 'las listas tienen tope');
  const sd = sanearDesafio(JSON.parse(JSON.stringify({ ...desafioNuevo(), asedio: a })));
  eq(sd.asedio.camino, a.camino, 'viaja por sanearDesafio');
  eq(sanearDesafio({}).asedio, null, 'una partida vieja sin asedio carga limpia');
  // el rastro
  const c = nuevoCamino();
  ok(!anotarRastro(c, 63, 0) && anotarRastro(c, 56, 0) && c.rastro.length === 2, 'anota una huella cada 5 m');
  for (let i = 0; i < RASTRO_MAX + 10; i++) anotarRastro(c, 56 - (i + 1) * 6, 0);
  ok(c.rastro.length <= RASTRO_MAX, 'y no crece sin fin');
  // textos y mapa
  a.camino = nuevoCamino();
  ok(/el Coihue está a \d+ m de tu base/.test(textoAsedio(a)), `el HUD dice a cuántos metros: «${textoAsedio(a)}»`);
  ok(textoAsedio({ ...a, camino: undefined }) === textoAsedio(sanearAsedio({ nave: { x: 62, z: 0 }, zonas: a.zonas })), 'sin camino el texto es el de siempre');
  const m = marcasAsedio(a);
  ok(m.some((q) => q.clase === 'ruta' && q.puntos.length >= 2), 'el mapa marca la ruta que le queda');
  ok(m.filter((q) => q.estado === 'nave').length === 1, 'y la nave, una sola vez');
  eq(marcasAsedio({ ...a, camino: undefined }).filter((q) => q.clase === 'ruta'), [], 'sin camino no hay ruta');
  a.camino.d = a.camino.largo * 0.5;
  const resto = rutaRestante(a.camino);
  cerca(resto[0][0], posicionCamino(a.camino).x, 1e-9, 'la ruta que queda arranca donde está');
  ok(resto.length >= 2 && largoRuta(resto) < a.camino.largo * 0.6, 'y es sólo lo que falta');
  const auto = marcasAutomaticas({ desafio: { asedio: { marcas: () => marcasAsedio(a) } } });
  ok(auto.some((q) => q.clase === 'ruta' && Array.isArray(q.puntos)), 'las marcas del papel llevan la línea de la ruta');
  ok(auto.filter((q) => q.clase === 'asedio').length === a.zonas.length + 1, 'y las de siempre (raíces y el Coihue)');
  a.camino.llego = true;
  ok(marcasCamino(a.camino).length === 0 && /sobre tu base/.test(textoCamino(a.camino)), 'llegado: sin ruta y con otro texto');
  // la puertita
  const ab = asedioConCamino();
  ok(!puedeAbordar(ab), 'con las cuatro raíces en pie no se puede entrar');
  ab.camino.llego = true;
  ok(puedeAbordar(ab) && zonasLibres(ab) === 0, 'pero si el Coihue llegó a tu base, la puertita se abre sola');
  ab.activo = false;
  ok(!puedeAbordar(ab), 'y no con el asedio terminado');
  // una zona libre no cambia lo de las agujas
  const ar = asedioConCamino();
  ar.zonas[1].vida = 1;
  ok(danarAncla(ar, 1, 5, true).rota && ar.camino.d === 0, 'cortar una raíz sigue siendo cortar una raíz');
  // la victoria y los números de las noches no se tocaron
  ok(NOCHE_FINAL === 20 && NOCHE_JEFE === 5, 'NOCHE_FINAL y NOCHE_JEFE siguen siendo los de siempre');
  ok(ASEDIO.zonasParaAbordar === 3 && ASEDIO.alturaNave === 52, 'el asedio sigue pidiendo tres zonas');
}

// ---------------------------------------------------------------- 2. la subida con peligros
{
  const R = PELIGROS.raices;
  // el ciclo
  const orden = ['reposo', 'aviso', 'barrido', 'tapa', 'vuelta'];
  for (let i = 0; i < 3; i++) {
    const vistas = [];
    for (let t = 0; t < periodoRaiz(i); t += 0.02) { const f = faseRaiz(t, i).fase; if (vistas[vistas.length - 1] !== f) vistas.push(f); }
    eq(vistas, orden, `la raíz ${i} recorre el ciclo en orden`);
    eq(faseRaiz(periodoRaiz(i) + 0.01, i).fase, 'reposo', 'y vuelve a empezar');
    ok(faseRaiz(R.reposo[i] + 0.01, i).fase === 'aviso', 'después del reposo viene el aviso');
  }
  ok(R.aviso >= 1.5, 'el aviso dura lo suficiente para leerlo (1,5 s o más)');
  ok(R.tapa <= 4 && periodoRaiz(0) <= 14, 'queda atravesada poco y el ciclo no es largo');
  ok(R.reposo.every((r) => r >= 3) && new Set(R.reposo).size === R.reposo.length, 'cada raíz con su ritmo, y descansa más de 3 s entre una y otra');
  // sólo arranca con alguien cerca
  const r = { i: 0, t: 0 };
  for (let k = 0; k < 400; k++) avanzarRaiz(r, 0.1, false);
  ok(r.t === 0, 'sin nadie cerca no arranca');
  for (let k = 0; k < 20; k++) avanzarRaiz(r, 0.1, true);
  ok(r.t > 1.9, 'con alguien cerca corre el reloj');
  // empezado, termina aunque te vayas
  for (let k = 0; k < 400 && faseRaiz(r.t, 0).fase !== 'reposo' || r.t > 0 && k < 5; k++) avanzarRaiz(r, 0.1, false);
  ok(r.t === 0 || faseRaiz(r.t, 0).fase === 'reposo', 'una vez empezado, el ciclo termina solo y se retira');
  // el barrido: sube arriba, baja, y se queda abajo
  const m = R.barre / 2;
  cerca(posicionBarrido('aviso', 0.5), m, 1e-9, 'antes del barrido está arriba');
  cerca(posicionBarrido('barrido', 0), m, 1e-9, 'el barrido empieza arriba');
  cerca(posicionBarrido('barrido', 1), -m, 1e-9, 'y termina abajo');
  let previa = Infinity, creciente = true;
  for (let u = 0; u <= 1; u += 0.05) { const p = posicionBarrido('barrido', u); if (p > previa + 1e-9) creciente = false; previa = p; }
  ok(creciente, 'siempre baja (no vuelve para atrás)');
  cerca(posicionBarrido('tapa', 0.5), -m, 1e-9, 'atravesada queda abajo');
  ok(salidaRaiz('reposo', 0.5) === 0 && salidaRaiz('tapa', 0.5) === 1 && salidaRaiz('vuelta', 1) === 0 && salidaRaiz('aviso', 1) < 1, 'la raíz sale de la pared, se estira y se retira');
  ok(raizSolida('tapa') && !raizSolida('aviso') && !raizSolida('barrido') && !raizSolida('vuelta') && !raizSolida('reposo'), 'sólo choca atravesada');
  // te agarra si estás en la franja del barredor y a la altura del escalón
  ok(barridoTeAgarra(0, 0.2, 0) && !barridoTeAgarra(2, 0, 0) && !barridoTeAgarra(0, 0, 4.2) && !barridoTeAgarra(0, 0, -2), 'te agarra en la franja, en el escalón; no desde la vuelta de arriba ni de abajo');
  ok(!barridoTeAgarra(R.banda + 0.1, 0, 0) && barridoTeAgarra(R.banda - 0.1, 0, 0), 'la franja mide lo que dice');
  // se puede esquivar: parado fuera de la franja en el momento en que pasa, no te toca; y el barrido tarda en llegar a cualquier lugar
  let agarrado = 0;
  for (let u = 0; u <= 1; u += 0.01) if (barridoTeAgarra(-m - R.banda - 0.2, posicionBarrido('barrido', u), 0)) agarrado++;
  eq(agarrado, 0, 'parado abajo del final no te agarra');
  let aviso = 0;
  for (let t = 0; t < periodoRaiz(0); t += 0.05) if (faseRaiz(t, 0).fase === 'aviso') aviso += 0.05;
  ok(aviso >= 1.7, 'hay casi dos segundos de aviso antes de cada barrido');
  // nunca encierra: la raíz sólida dura menos que su ciclo, y aunque esté siempre cerca vuelve a abrir
  let sol = 0, tot = 0;
  for (let t = 0; t < periodoRaiz(2) * 3; t += 0.05) { tot += 0.05; if (raizSolida(faseRaiz(t % periodoRaiz(2), 2).fase)) sol += 0.05; }
  ok(sol / tot < 0.4, `atravesada menos del 40% del tiempo (${(100 * sol / tot).toFixed(0)}%)`);
  const rs = { i: 2, t: 0 };
  let maxSolida = 0, corrida = 0;
  for (let k = 0; k < 1500; k++) { avanzarRaiz(rs, 0.05, true); if (raizSolida(faseRaiz(rs.t, 2).fase)) { corrida += 0.05; maxSolida = Math.max(maxSolida, corrida); } else corrida = 0; }
  ok(maxSolida <= R.tapa + 0.2, `con vos siempre cerca, nunca la tapa más de ${R.tapa} s seguidos (${maxSolida.toFixed(2)})`);
  // dónde se paran: parejas, repartidas y lejos de los descansos
  const tramos = [];
  let y = 0.2;
  for (let i = 0; i < 190; i++) { tramos.push({ alto: y }); if (!(i % 60 >= 28 && i % 60 < 31)) y += 0.2; }
  const descansos = [{ y: tramos[29].alto }, { y: tramos[89].alto }, { y: tramos[149].alto }];
  const lug = lugaresRaices(tramos, descansos, 3);
  ok(lug.length === 3 && lug.every((i, k) => k === 0 || i - lug[k - 1] >= 14), `tres raíces, repartidas (${lug.join(', ')})`);
  ok(lug.every((i) => i >= 12 && i <= tramos.length - 16), 'no en la puerta de abajo ni en la del corazón');
  ok(lug.every((i) => descansos.every((d) => Math.abs(d.y - tramos[i].alto) >= 1.4)), 'ni cerca de un descanso');
  eq(lugaresRaices(tramos.slice(0, 20), [], 3), [], 'una escalera chica no lleva raíces');
  // las dos cosas no pasan con poca salud
  ok(PELIGROS.saludMinima >= 20 && PELIGROS.ramas.dano <= 8 && R.dano <= 8, 'los golpes son chicos y con poca salud no se hace daño');
  ok(PELIGROS.ramas.vida >= 20 && PELIGROS.ramas.aviso >= 1 && PELIGROS.ramas.cada >= 4 && PELIGROS.ramas.minimo >= 3, 'los duendes de las ramas avisan, esperan entre tiros y no tiran de cerca');
}

// ---------------------------------------------------------------- 3. los lugares del valle
const ZV = [{ id: 'base', x: 0, z: 40 }, { id: 'estacion', x: 200, z: 0 }, { id: 'lago', x: -150, z: 90 }, { id: 'bosque', x: 60, z: -220 }];
{
  const v = valleNuevo(ZV);
  eq(v.zonas.map((z) => z.id), ['estacion', 'lago', 'bosque'], 'el valle tiene los tres lugares de afuera (la base no se toma)');
  ok(v.zonas.every((z) => z.nivel === 0) && !v.cerrado, 'arrancan libres');
  eq(valleNuevo([]), null, 'sin lugares no hay valle');
  eq(valleNuevo([{ id: 'lago', x: 'x', z: 1 }, { id: 'marte', x: 1, z: 1 }]), null, 'ni con lugares rotos o inventados');
  eq(valleNuevo([{ id: 'lago', x: 1, z: 2 }, { id: 'lago', x: 5, z: 5 }]).zonas.length, 1, 'ni repetidos');
  // cuándo toman
  ok(TOMADAS.desdeNoche === 3 && TOMADAS.cadaNoches === 2 && TOMADAS.maxTomadas === 2, 'desde la noche 3, una cada dos noches, de a dos como mucho');
  const azar = azarFijo(3);
  eq(tomarAlAmanecer(v, 1, azar), [], 'antes de la noche 3 no toman nada');
  eq(tomarAlAmanecer(v, 2, azar), [], 'ni en la 2');
  const h3 = tomarAlAmanecer(v, 3, azar);
  ok(h3.length === 1 && h3[0].tipo === 'tomada' && zonasTomadasDelValle(v).length === 1, 'en la 3 toman uno');
  eq(tomarAlAmanecer(v, 4, azar), [], 'en la 4 no (es cada dos)');
  const h5 = tomarAlAmanecer(v, 5, azar);
  ok(h5.length === 1 && zonasTomadasDelValle(v).length === 2 && h5[0].id !== h3[0].id, 'en la 5 toman otro, distinto');
  eq(tomarAlAmanecer(v, 7, azar), [], 'con dos tomados no toman un tercero: el valle nunca queda entero perdido');
  eq(v.tomadas, 2, 'se cuentan');
  // los nidos
  const z = zonasTomadasDelValle(v)[0];
  eq(nidosDeZona(z), 1, 'un lugar recién tomado tiene un nido');
  const esBueno = (x, zz) => Math.hypot(x - z.x, zz - z.z) > 5;
  const nido = lugarNidoDeZona(z, [], esBueno, azarFijo(9));
  ok(nido && Math.hypot(nido.x - z.x, nido.z - z.z) >= TOMADAS.nidoRadio[0] - 0.2 && Math.hypot(nido.x - z.x, nido.z - z.z) <= TOMADAS.nidoRadio[1] + 0.2, 'el nido crece cerca del centro del lugar');
  ok(lugarNidoDeZona(z, [], () => false, azarFijo(9)) === null, 'si no hay dónde, no hay nido (no se cuelga)');
  const otro = lugarNidoDeZona(z, [nido], () => true, azarFijo(9));
  ok(!otro || Math.hypot(otro.x - nido.x, otro.z - nido.z) >= 6, 'y los nidos de un lugar no se pisan');
  // si no lo sacás, el nido se abre y el lugar se cierra más
  const ab1 = abrirseNidoDeZona(v, z.id);
  ok(ab1.ok && ab1.nivel === 2 && z.nivel === 2, 'el nido que se abre cierra un escalón más');
  eq(extraDeZona(z), ['saltador'], 'con el lugar más cerrado salen más duendes');
  abrirseNidoDeZona(v, z.id);
  ok(z.nivel === TOMADAS.nivelMax, 'hasta el tope');
  abrirseNidoDeZona(v, z.id);
  ok(z.nivel === TOMADAS.nivelMax, 'que no se pasa');
  eq(extraDeZona(z), ['saltador', 'rastreador'], 'lo más oscuro: dos de más');
  eq(nidosDeZona(z), 2, 'y dos nidos');
  ok(!abrirseNidoDeZona(v, 'toString').ok && !abrirseNidoDeZona(v, 'marte').ok && !abrirseNidoDeZona(null, 'lago').ok, 'un lugar que no existe no rompe nada');
  // si lo sacás, baja de a un escalón; con todos los nidos fuera
  let s1 = sacaronNidoDeZona(v, z.id, 1, 9);
  ok(s1.ok && !s1.baja && z.nivel === 3, 'sacar uno de dos no baja el lugar todavía');
  s1 = sacaronNidoDeZona(v, z.id, 0, 9);
  ok(s1.baja && s1.nivel === 2 && !s1.recuperada, 'sacar el último baja un escalón');
  s1 = sacaronNidoDeZona(v, z.id, 0, 9);
  ok(s1.nivel === 1 && !s1.recuperada, 'otro');
  s1 = sacaronNidoDeZona(v, z.id, 0, 9);
  ok(s1.recuperada && z.nivel === 0 && s1.premio === TOMADAS.premio && v.recuperadas === 1, 'en 0 queda recuperado, con premio');
  ok(z.hasta === 9 + TOMADAS.respiro, 'y unas noches de respiro');
  ok(!sacaronNidoDeZona(v, z.id, 0, 9).ok, 'sacar un nido de un lugar libre no hace nada');
  // el respiro: no lo vuelven a tomar enseguida
  const v2 = valleNuevo(ZV.filter((q) => q.id === 'lago'));
  v2.zonas[0].hasta = 12;
  eq(tomarAlAmanecer(v2, 11, () => 0), [], 'en el respiro no lo toman');
  ok(tomarAlAmanecer(v2, 13, () => 0).length === 1, 'y después sí');
  // qué afecta
  const t = zonasTomadasDelValle(v)[0];
  ok(tomadaEn(v, t.x + 5, t.z, 0)?.id === t.id, 'en el lugar tomado se bloquea');
  ok(tomadaEn(v, t.x + TOMADAS.radio + 2, t.z, 0) === null && tomadaEn(v, t.x + TOMADAS.radio + 2, t.z, 5)?.id === t.id, 'afuera de la mancha no (con el margen, sí)');
  ok(tomadaEn(v, z.x, z.z, 0) === null, 'el recuperado vuelve a ser de todos');
  ok(tomadaEn(null, 0, 0) === null, 'sin valle, nada se bloquea');
  const mv = marcasValle(v);
  ok(mv.length === zonasTomadasDelValle(v).length && mv.every((q) => q.clase === 'tomada' && q.radio === TOMADAS.radio && /tomada/.test(q.nombre)), 'el mapa marca los lugares tomados');
  ok(marcasAutomaticas({ desafio: { valle: { marcas: () => mv } } }).filter((q) => q.clase === 'tomada').length === mv.length, 'y llegan al papel con su radio');
  ok(nombreTomada('lago') === 'la orilla del lago' && nombreTomada('toString') === 'el lugar', 'los nombres de siempre');
  eq(TOMADAS.ids, ['estacion', 'lago', 'bosque'], 'son los lugares de las raíces del asedio');
  // se cierra con el asedio
  cerrarValle(v);
  ok(v.cerrado && zonasTomadasDelValle(v).length === 0 && tomadaEn(v, t.x, t.z) === null, 'al empezar el asedio se cierra y nada queda bloqueado');
  eq(tomarAlAmanecer(v, 9, () => 0), [], 'ni toman más');
  ok(!abrirseNidoDeZona(v, t.id).ok, 'ni crece');
}

// ---------------------------------------------------------------- 3b. guardado y saneo del valle y de sus nidos
{
  const v = valleNuevo(ZV);
  tomarAlAmanecer(v, 3, azarFijo(5));
  eq(sanearValle(JSON.parse(JSON.stringify(v))), v, 'ida y vuelta por el guardado');
  eq(sanearValle(null), null, 'nada: nada');
  eq(sanearValle('x'), null, 'texto: nada');
  eq(sanearValle([]), null, 'lista: nada');
  eq(sanearValle({}), null, 'vacío: nada');
  eq(sanearValle({ zonas: [] }), null, 'sin lugares: nada');
  const roto = sanearValle({ zonas: [{ id: 'lago', x: 1, z: 2, nivel: 99, hasta: -4 }, { id: 'lago', x: 9, z: 9 }, { id: 'marte', x: 0, z: 0 }, { id: 'toString', x: 0, z: 0 }, { id: 'bosque', x: 'x', z: 3 }, { id: 'estacion', x: 3, z: 4, nivel: 'mucho', hasta: 1e12 }], tomadas: -3, recuperadas: 'dos', cerrado: 0 });
  eq(roto.zonas.map((q) => q.id), ['lago', 'estacion'], 'sin repetidos, inventados ni rotos');
  eq(roto.zonas.map((q) => q.nivel), [TOMADAS.nivelMax, 0], 'el nivel se acota');
  ok(roto.zonas[0].hasta === 0 && roto.zonas[1].hasta === 1e6, 'el respiro se acota');
  ok(roto.tomadas === 0 && roto.recuperadas === 0 && roto.cerrado === false, 'los contadores también');
  const cerrado = sanearValle({ zonas: [{ id: 'lago', x: 1, z: 2, nivel: 3 }], cerrado: true });
  ok(cerrado.cerrado && cerrado.zonas[0].nivel === 0, 'cerrado carga sin niveles (no revive nada)');
  eq(sanearValle({ zonas: Array.from({ length: 50 }, (_, i) => ({ id: ['lago', 'bosque', 'estacion'][i % 3], x: i, z: i })) }).zonas.length, 3, 'una lista enorme se acota a los tres');
  // en la partida
  eq(desafioNuevo().valle, null, 'una partida nueva no tiene lugares tomados');
  eq(sanearDesafio({}).valle, null, 'una partida vieja carga limpia');
  eq(sanearDesafio({ valle: 'basura' }).valle, null, 'basura también');
  eq(sanearDesafio(JSON.parse(JSON.stringify({ ...desafioNuevo(), valle: v }))).valle, v, 'viaja con el Desafío');
  // los nidos de los lugares
  const cap = sanearCapullos([{ x: 1, z: 2, golpes: 1, zona: 'lago' }, { x: 3, z: 4, zona: 'marte' }, { x: 5, z: 6, zona: 'toString' }, { x: 7, z: 8, zona: 4 }, { x: 9, z: 9 }]);
  eq(cap.map((c) => c.zona), ['lago', undefined, undefined, undefined, undefined], 'el nido sólo conserva el lugar si existe');
  ok(!('zona' in cap[1]), 'sin lugar inventado');
  const muchos = sanearCapullos(Array.from({ length: 40 }, (_, i) => ({ x: i, z: 0, zona: 'lago' })));
  eq(muchos.length, CAPULLOS.max + CAPULLOS.deZonas, 'la lista de nidos tiene su tope (los del bosque y los de los lugares)');
  eq(sanearCapullos([{ x: 1, z: 2, golpes: 9 }, { x: 'a' }]).length, 1, 'los rotos siguen cayéndose');
  ok(nidosDeZona({ nivel: 3 }) * 2 <= CAPULLOS.deZonas, 'los nidos de los lugares caben en el tope');
}

// ---------------------------------------------------------------- 4. el enganche con el juego
{
  const desafio = leer('src/desafio.js'), asedio = leer('src/desafio-asedio-mundo.js'), nave = leer('src/desafio-nave-mundo.js'), main = leer('src/main.js');
  const mapa = leer('src/mapa.js'), tomadasM = leer('src/desafio-tomadas-mundo.js'), mapaMundo = leer('src/desafio-mapa-mundo.js'), chinches = leer('src/chinches.js');
  // el camino
  ok(enUnaLinea(asedio, ['crearCamino(a)', 'ruta hasta tu base']), 'al empezar el asedio se calcula la ruta');
  ok(enUnaLinea(asedio, ['nocheCamino(a)', '4.10 coihue']), 'cada noche del asedio se vuelve a calcular y se pone en marcha');
  ok(enUnaLinea(asedio, ['albaCamino(a)', '4.10 coihue']), 'al amanecer se cierra');
  ok(enUnaLinea(asedio, ['tickCamino(c', 'horasDeNoche']), 'camina con la hora de juego');
  ok(enUnaLinea(asedio, ['if (n?.pies)', 'herirPatas']), 'las raíces de apoyo reciben los golpes por el camino de siempre');
  ok(enUnaLinea(asedio, ['asedio: true', 'ancla: true', 'pies: true']), 'son blancos del asedio (la lanza y el hacha también les pegan)');
  ok(/function pushPies\(\) \{\s*if \(!piesVivos\(\)/.test(asedio), 'sólo con el Coihue en pie');
  ok(enUnaLinea(asedio, ['api.caerCerco', '32']), 'al llegar cae el cerco (daño a las obras de alrededor)');
  ok(asedio.includes('if (c.llego && !c.cerco && vis.d >= c.d - 0.15) alLlegar(c, n);'), 'el cerco cae una sola vez, cuando termina el último paso');
  ok(/if \(vis\.zancada \|\| gap/.test(asedio) || asedio.includes('(gap > 0.04 && !r.camina)'), 'va a zancadas');
  ok(/else if \(vis\.zancada && raicesPuestas\) sacarRaices\(\)/.test(asedio) && asedio.includes('!vis.zancada && !raicesPuestas) ponerRaices(n, a)'), 'las raíces chocan parado y no caminando');
  ok(asedio.includes('tomadas') === false && asedio.includes('api.alEmpezarAsedio?.()'), 'el asedio avisa que empezó (los lugares tomados se cierran)');
  ok(enUnaLinea(desafio, ['api.alEmpezarAsedio', 'tomadas.cerrar()']), 'y los lugares tomados lo escuchan');
  ok(enUnaLinea(desafio, ['api.sitioInterior', 'asedioMundo.sitioInterior']), 'el corazón se arma donde se plantó');
  ok(enUnaLinea(nave, ['const si = api.sitioInterior?.() || s;']), 'el interior no se muda con el Coihue');
  ok(enUnaLinea(nave, ['subida = construirSubida(si)']) && enUnaLinea(nave, ['arena = construir(si)']), 'la escalera y la sala se arman sobre el llano de siempre');
  ok(enUnaLinea(nave, ['api.sitioHaz', 'hacerSalida']) || nave.includes("const s = api.sitioHaz?.() || subida?.sitio"), 'pero se sale afuera por donde está parado ahora');
  ok(enUnaLinea(desafio, ['get temblor()', 'asedioMundo.temblor']), 'el temblor sale del Desafío');
  ok(enUnaLinea(main, ['desafio.temblor > 0.01', "modo === 'jugando'"]) && enUnaLinea(main, ["ajustes.movimientoCamara === 'reducido'", '0.15']), 'la cámara tiembla (menos con la cámara reducida)');
  ok(enUnaLinea(chinches, ['m.clase === \'ruta\'']) && enUnaLinea(mapa, ["a.clase === 'ruta'", 'a.puntos']), 'el papel dibuja la línea de la ruta');
  ok(enUnaLinea(desafio, ['api.trampasEn', 'TRAMPAS_COIHUE']) && /TRAMPAS_COIHUE = \['pozo', 'red', 'abrojos', 'miel', 'lazo', 'foso', 'estacas'\]/.test(desafio), 'las trampas que lo enredan son las de las defensas');
  ok(enUnaLinea(desafio, ['api.obraCerca', 'completa(o)']), 'la ruta esquiva las obras');
  // la subida
  ok(enUnaLinea(nave, ['armarPeligros(s)', '4.10 coihue']) && enUnaLinea(nave, ['actualizarRaices(dt, js)', '4.10 coihue']), 'se arman con la subida y corren por cuadro');
  ok(enUnaLinea(nave, ['if (n?.rama)', 'herirRama']), 'los duendes de las ramas reciben los golpes por el camino de siempre');
  ok(enUnaLinea(nave, ['nave: true, rama: true, asedio: true']), 'son blancos (el arco, la honda y los golpes)');
  ok(enUnaLinea(nave, ['reiniciarPeligros();', 'coihue']), 'al entrar a subir arrancan como nuevos');
  ok((nave.match(/reposarRaices\(\)/g) || []).length >= 3, 'al entrar al corazón las raíces se guardan');
  ok(enUnaLinea(nave, ['r.sol = { seg: true', 'duenio: DUENIO']) && enUnaLinea(nave, ['col.eliminar(r.sol)']), 'atravesada choca y se saca sola (la física de la escalera se limpia con todo)');
  ok(enUnaLinea(nave, ['!adentroDeLaZona']), 'nunca se atraviesa encima tuyo');
  ok(enUnaLinea(nave, ['saludParaDano()']) && nave.includes('PELIGROS.saludMinima'), 'con poca salud no hace daño');
  ok(enUnaLinea(nave, ['tapaLaColumna(']), 'los duendes de las ramas no tiran a través del tronco del medio');
  ok(nave.includes('cuerpoV') === false, 'sin trampa: la prueba de 3.8 se ajustó, no la saltearon');
  // los lugares tomados
  ok(enUnaLinea(desafio, ['tomadas.alAmanecer()']), 'al amanecer se decide si toman un lugar');
  ok(enUnaLinea(desafio, ['if (c.zona)', 'tomadas.alAbrirseNido(c)']), 'el nido de un lugar se abre con los demás, de noche');
  ok(enUnaLinea(desafio, ['tomadas.alQuitarNido(c)', 'lugar tomado']) || (desafio.match(/tomadas\.alQuitarNido\(c\)/g) || []).length === 2, 'quemarlo o romperlo lo saca');
  ok(enUnaLinea(desafio, ['tomadas.actualizar(dt, js)']) && enUnaLinea(desafio, ['tomadas.limpiar()']), 'se actualiza por cuadro y se limpia');
  ok(enUnaLinea(desafio, ['get valle()', 'tomadas']), 'el hacha y el papel lo miran');
  ok(enUnaLinea(main, ['function lugarTomado(o', 'avisar']) && enUnaLinea(main, ['if (lugarTomado(o)) return;']) && enUnaLinea(main, ['lugarTomado(o, false)']), 'el hacha y el pico se frenan (y el cartel de la H lo dice)');
  ok(enUnaLinea(mapaMundo, ['ctx.bloquea?.(s.x, s.z)']) && enUnaLinea(desafio, ['bloquea: (x, z) => !!tomadas.bloquea(x, z)']), 'los recursos del mapa de la semilla también');
  ok(enUnaLinea(chinches, ['clase: \'tomada\'']) && enUnaLinea(mapa, ["a.clase === 'tomada'"]), 'el papel dibuja la mancha');
  ok(enUnaLinea(tomadasM, ['ubicarZonas(T.lugares', "azarDe(d.semilla, 'asedio')"]), 'los lugares son los mismos puntos de las raíces del asedio');
  ok(/matTinte = \(\) => new THREE\.MeshBasicMaterial\(\{ vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 \}\)/.test(tomadasM), 'el tinte usa el mismo material de la mancha de las raíces (no compila nada nuevo)');
  ok(!/PointLight|ShaderMaterial|SpotLight|DirectionalLight/.test(tomadasM) && !/PointLight|ShaderMaterial/.test(leer('src/desafio-camino.js')), 'sin luces ni shaders nuevos');
  ok(/if \(d\.valle \|\| d\.asedio \|\| d\.victoria\) return d\.valle \|\| null;/.test(tomadasM), 'no se crean lugares una vez empezado el asedio');
  // el guardado
  ok(enUnaLinea(leer('src/desafio-reglas.js'), ['valle: sanearValle(x.valle)']) && enUnaLinea(leer('src/desafio-reglas.js'), ['valle: null']), 'se guarda con saneo; una partida vieja carga limpia');
  // el idioma y lo religioso
  const RELIGIOSO = /capilla|\bmisa\b|\bcura\b|\bcuras\b|\brez[aoá]|\bdios|\bsant[oa]s?\b|bendi|iglesia|altar|parroq|milagro|virgen|sagrad[oa]s? |ángel|amén|pecado/i;
  for (const f of ['src/desafio-camino.js', 'src/desafio-tomadas-mundo.js']) ok(!RELIGIOSO.test(leer(f)), `${f}: nada religioso`);
  for (const f of ['src/desafio-camino.js', 'src/desafio-tomadas-mundo.js', 'src/desafio-valle.js', 'src/desafio-nave.js', 'src/desafio-asedio.js', 'src/desafio-infestacion.js']) {
    const t = leer(f);
    ok(!t.includes('\r'), `${f}: LF`);
    ok(!/^import\s[^;]*\n/m.test(t.replace(/^import[^\n]*;\s*$/gm, '')), `${f}: imports en una línea`);
    ok(!/[ñÑ]/.test((t.match(/^export (?:const|function|let|class) ([^ (=]+)/gm) || []).join('\n')), `${f}: exportados sin eñe`);
  }
}

console.log(`verificar-4-10-coihue: ${n} comprobaciones ✓`);
