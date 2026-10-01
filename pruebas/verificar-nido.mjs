// 1.7 — el segundo acto del Desafío: el nido.
// La nodriza cae la noche 20 y el modo se daba por ganado, pero los invasores
// seguían bajando sin motivo. El nido es de dónde salen.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {
  NIDO, VIDA_NIDO, nidoNuevo, sanearNido, radioCerco, estaRevelado, cercoDeBusqueda,
  sumarPista, textoPista, estaAbierto, vidaNido, camarasEnteras, danarNido,
  resumenNido, siguenLasNoches, desafioTerminado, lugarDelNido,
} from '../src/desafio-nido.js';
import { sanearDesafio, desafioNuevo } from '../src/desafio-reglas.js';
import { marcasAutomaticas } from '../src/chinches.js';
import { LIMITE } from '../src/config.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');

// ---------------------------------------------------------------- nacer y sanear
assert.equal(nidoNuevo(null), null, 'sin lugar no hay nido');
assert.equal(nidoNuevo({ x: 'a', z: 1 }), null);
const n0 = nidoNuevo({ x: 120, z: -80 });
assert.equal(n0.pistas, 0);
assert.equal(n0.camaras.length, NIDO.camaras);
assert.equal(vidaNido(n0), VIDA_NIDO);
assert.equal(n0.caido, false);

assert.equal(sanearNido(null), null);
assert.equal(sanearNido({ x: 1 }), null, 'sin las dos coordenadas no entra');
const sano = sanearNido({ x: 9e9, z: -9e9, pistas: 99, camaras: [1e9, 'x', -50, 7, 7], caido: 'sí' });
assert.equal(sano.x, LIMITE, 'la posición se acota al mapa');
assert.equal(sano.z, -LIMITE);
assert.equal(sano.pistas, NIDO.pistas, 'las pistas no pasan del tope');
assert.equal(sano.camaras.length, NIDO.camaras, 'siempre las mismas cámaras');
assert.deepEqual(sano.camaras, [NIDO.vidaCamara, NIDO.vidaCamara, 0], 'valores rotos vuelven a su sitio');
assert.equal(sano.caido, true);

// viaja en la partida del Desafío
assert.equal(desafioNuevo().nido, null, 'una partida nueva no tiene nido: aparece al ganar');
assert.equal(sanearDesafio({ nido: { x: 5, z: 6 } }).nido.x, 5);
assert.equal(sanearDesafio({}).nido, null);
assert.equal(sanearDesafio({ nido: 'basura' }).nido, null);

// ---------------------------------------------------------------- la búsqueda
const n = nidoNuevo({ x: 300, z: 200 });
assert.equal(radioCerco(n), NIDO.radios[0]);
assert.equal(estaRevelado(n), false);
let previo = radioCerco(n);
for (let i = 1; i <= NIDO.pistas; i++) {
  const r = sumarPista(n, 0.5);
  assert.equal(r.nueva, true);
  assert.equal(n.pistas, i);
  const ahora = radioCerco(n);
  assert.ok(ahora < previo, `la pista ${i} tiene que achicar el cerco (${previo} -> ${ahora})`);
  previo = ahora;
}
assert.equal(estaRevelado(n), true, 'con las tres pistas queda ubicado');
assert.equal(cercoDeBusqueda(n), null, 'ubicado ya no se dibuja el cerco');
assert.equal(sumarPista(n, 0.5).nueva, false, 'no se acumulan pistas de más');
assert.equal(n.pistas, NIDO.pistas);

// el cerco nunca deja al nido afuera
for (const azar of [0, 0.17, 0.33, 0.5, 0.71, 0.99]) {
  const m = nidoNuevo({ x: 0, z: 0 });
  for (let i = 0; i < NIDO.pistas - 1; i++) {
    sumarPista(m, azar);
    const c = cercoDeBusqueda(m);
    if (!c) continue;
    const d = Math.hypot(m.x - c.x, m.z - c.z);
    assert.ok(d <= c.radio, `con azar ${azar} el cerco dejó al nido afuera (${d} > ${c.radio})`);
  }
}
assert.match(textoPista(nidoNuevo({ x: 0, z: 0 })), /cerco/);
assert.match(textoPista(n), /marcado en el mapa/);

// ---------------------------------------------------------------- de día se abre, de noche no
assert.equal(estaAbierto(12), true, 'al mediodía está abierto');
assert.equal(estaAbierto(NIDO.horaAbre), true);
assert.equal(estaAbierto(NIDO.horaAbre - 0.1), false);
assert.equal(estaAbierto(NIDO.horaCierra), false, 'a la hora de cierre ya está cerrado');
assert.equal(estaAbierto(2), false, 'de madrugada, cerrado');
assert.equal(estaAbierto(36), true, 'las horas dan la vuelta: 36 es mediodía');
assert.equal(estaAbierto(26), false, 'y 26 son las dos de la mañana');
assert.equal(estaAbierto(-2), false, 'las diez de la noche');

const roto = nidoNuevo({ x: 0, z: 0 });
assert.deepEqual(danarNido(roto, 100, 2), { ok: false, motivo: 'cerrado' }, 'de noche no le entra nada');
assert.equal(vidaNido(roto), VIDA_NIDO, 'y no perdió vida');
assert.deepEqual(danarNido(roto, 0, 12), { ok: false, motivo: 'sindano' });
assert.equal(danarNido(null, 10, 12).ok, false);

// se revientan de a una, en orden
let r = danarNido(roto, NIDO.vidaCamara - 1, 12);
assert.equal(r.ok, true);
assert.equal(r.camara, 0);
assert.equal(r.rota, false);
assert.equal(camarasEnteras(roto), NIDO.camaras);
r = danarNido(roto, 5, 12);
assert.equal(r.rota, true, 'el golpe que la vacía se nota');
assert.equal(r.caido, false);
assert.equal(camarasEnteras(roto), NIDO.camaras - 1);
assert.equal(roto.camaras[0], 0);
// el sobrante no se pasa a la siguiente: cada cámara se trabaja aparte
assert.equal(roto.camaras[1], NIDO.vidaCamara);
r = danarNido(roto, NIDO.vidaCamara, 12);
assert.equal(r.camara, 1);
r = danarNido(roto, NIDO.vidaCamara * 3, 12);
assert.equal(r.caido, true, 'la última lo tumba');
assert.equal(roto.caido, true);
assert.equal(vidaNido(roto), 0);
assert.deepEqual(danarNido(roto, 100, 12), { ok: false, motivo: 'caido' }, 'caído no se pega más');

// ---------------------------------------------------------------- las noches y el final
assert.equal(siguenLasNoches({ victoria: false }), true, 'antes de la nodriza, obvio');
assert.equal(siguenLasNoches({ victoria: true, nido: null }), true, 'sin nido todavía, siguen');
assert.equal(siguenLasNoches({ victoria: true, nido: nidoNuevo({ x: 0, z: 0 }) }), true);
assert.equal(siguenLasNoches({ victoria: true, nido: roto }), false, 'con el nido caído se terminan');
assert.equal(desafioTerminado({ victoria: true, nido: roto }), true);
assert.equal(desafioTerminado({ victoria: false, nido: roto }), false, 'sin ganar no está terminado');
assert.equal(desafioTerminado({ victoria: true, nido: nidoNuevo({ x: 0, z: 0 }) }), false);

// ---------------------------------------------------------------- lo que se muestra
assert.equal(resumenNido(null, 12), null);
const buscando = nidoNuevo({ x: 0, z: 0 });
assert.equal(resumenNido(buscando, 12).buscando, true);
assert.match(resumenNido(buscando, 12).texto, /sin ubicar/);
const ubicado = nidoNuevo({ x: 0, z: 0 });
for (let i = 0; i < NIDO.pistas; i++) sumarPista(ubicado, 0.5);
assert.match(resumenNido(ubicado, 12).texto, /abierto/);
assert.match(resumenNido(ubicado, 3).texto, /cerrado/);
assert.equal(resumenNido(ubicado, 12).fraccion, 1);
assert.equal(resumenNido(roto, 12).caido, true);

// ---------------------------------------------------------------- dónde cae
const centro = { x: 0, z: 0 };
let azarI = 0;
const azares = [0.1, 0.2, 0.7, 0.4, 0.9, 0.3];
const azar = () => azares[azarI++ % azares.length];
const sitio = () => true;
const lugar = lugarDelNido(centro, sitio, azar);
assert.ok(lugar, 'encuentra lugar');
const dist = Math.hypot(lugar.x - centro.x, lugar.z - centro.z);
assert.ok(dist >= NIDO.distanciaMinima, `el nido no puede caer pegado a la base (${Math.round(dist)} m)`);
assert.ok(Math.abs(lugar.x) <= LIMITE && Math.abs(lugar.z) <= LIMITE, 'cae dentro del mapa');
assert.equal(lugarDelNido(centro, () => false, azar), null, 'si ningún punto sirve, no inventa uno');

// ---------------------------------------------------------------- el mapa
const marcasBuscando = marcasAutomaticas({ desafio: { nido: { x: 10, z: 20, radio: 300, revelado: false, caido: false } } });
assert.equal(marcasBuscando.length, 1);
assert.equal(marcasBuscando[0].clase, 'cerco');
assert.equal(marcasBuscando[0].radio, 300);
const marcasUbicado = marcasAutomaticas({ desafio: { nido: { x: 10, z: 20, revelado: true, caido: false } } });
assert.equal(marcasUbicado[0].clase, 'nido');
assert.equal(marcasAutomaticas({ desafio: { nido: { x: 1, z: 2, caido: true } } }).length, 0, 'caído sale del mapa');
assert.equal(marcasAutomaticas({ desafio: {} }).length, 0);

// ---------------------------------------------------------------- cableado
const desafio = leer('src/desafio.js'), eventos = leer('src/desafio-eventos.js'), mapaJs = leer('src/mapa.js');
assert.match(desafio, /abrirSegundoActo\(\);/, 'ganarle a la nodriza abre el segundo acto');
assert.match(desafio, /d\.nido = nidoNuevo\(p\)/);
assert.match(desafio, /if \(!siguenLasNoches\(d\)\) \{/, 'con el nido caído no baja nadie más');
assert.match(desafio, /alCaerNido: \(\) => caerNido\(\)/);
assert.match(desafio, /horas: \(\) => progreso\(\)\.horas/, 'el nido necesita la hora');
assert.match(eventos, /function blancosNido\(\)/);
assert.match(eventos, /if \(n\?\.nido\) \{ herirCamara\(n, dano\); return; \}/,
  'las cámaras entran por el mismo camino que los núcleos, así todas las armas ya le pegan');
assert.match(eventos, /if \(!estaAbierto\(api\.horas\?\.\(\) \?\? 12\)\) return \[\];/,
  'de noche no hay a qué apuntarle');
assert.match(eventos, /function pistaDeNido\(\)/, 'los restos de nave dan las señales');
assert.match(eventos, /const faltaPista = !!d\.nido && !d\.nido\.caido && !estaRevelado\(d\.nido\)/,
  'después de la victoria los restos siguen cayendo mientras falten señales');
assert.match(mapaJs, /a\.clase === 'cerco' && a\.radio > 0/, 'el mapa dibuja el cerco');
// Las tres cosas que encontró la prueba de humo (pruebas/humo-nido.cjs) y que la
// lógica pura no podía ver, porque dependen del mundo:
assert.match(eventos, /m\.position\.set\(Math\.cos\(a\) \* 2\.6, 3, Math\.sin\(a\) \* 2\.6\)/,
  'las cámaras van sobre el suelo: a ras de tierra el rayo de las armas se corta antes de llegar');
assert.match(desafio, /function camaraNidoCerca\(js, alcance\)/,
  'al nido se le entra también a hachazos: si no, el que nunca fabricó un arco no puede terminar');
assert.match(desafio, /const c = camaraNidoCerca\(js, arma\.alcance \+ 1\.6\);/);
assert.match(desafio, /if \(!siguenLasNoches\(d\)\) \{\s*\n\s*\/\/ Con el nido abajo/,
  'el aviso del nido caído va antes que las ramas de hora de ataque, o no se lee nunca');
assert.match(leer('src/desafio-reglas.js'), /nido: sanearNido\(x\.nido\)/);

console.log('nido: ok ·', NIDO.camaras, 'cámaras ·', VIDA_NIDO, 'de vida ·',
  NIDO.pistas, 'señales para ubicarlo · sólo se rompe de día');

// ---------------------------------------------------------------- el final tiene pantalla
const mainJs = leer('src/main.js'), plantilla = leer('src/plantilla.html');
assert.match(mainJs, /alTerminar: \(s\) => mostrarVictoria\(s, true\)/, 'el nido tiene su propio final');
assert.match(mainJs, /function mostrarVictoria\(s, final = false\)/, 'la pantalla sirve para los dos');
assert.match(mainJs, /final \? 'El nido cayó'/);
for (const id of ['victoria-titulo', 'victoria-sub', 'victoria-texto']) {
  assert.ok(plantilla.includes(`id="${id}"`), `falta ${id} en la plantilla`);
}
assert.ok(!/podés seguir resistiendo noche tras noche/.test(plantilla),
  'la victoria ya no promete noches sin sentido: ahora apunta al nido');
