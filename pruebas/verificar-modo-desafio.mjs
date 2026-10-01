// Modo Desafío: reglas puras (horario, oleadas, recetas, resistencia) y cableado
// estático de menú, guardado separado por modo, HUD y teclas.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {
  HORA_ATAQUE, HORA_AMANECER, claveNoche, esHoraDeAtaque, segundosHasta, relojCorto, composicionOleada,
  multiplicadorNoche, ARMAS, RECETAS, vidaMaxObra, costoReparacion, desafioNuevo, sanearDesafio, TIPOS_ALIEN,
  DIFICULTADES, dificultad, suministrosDelAlba, armaEfectiva, nocheEspecial, aplicarEspecial, efectoClima, nocheConRestos,
  ESPECIALES, NOCHE_FINAL, CATEGORIAS_TALLER, REFUERZOS, PLANOS_ALIEN, NUCLEO_VIDA, COMPANEROS,
} from '../src/desafio-reglas.js';
import { avanzarTutorial, PASOS_TUTORIAL } from '../src/desafio-tutorial.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');

// horario
assert.ok(esHoraDeAtaque(HORA_ATAQUE) && esHoraDeAtaque(23.9) && esHoraDeAtaque(0) && esHoraDeAtaque(5.99));
assert.ok(!esHoraDeAtaque(HORA_AMANECER) && !esHoraDeAtaque(12) && !esHoraDeAtaque(20.49));
assert.equal(claveNoche(3, 22), 3, 'la noche empieza el día 3');
assert.equal(claveNoche(4, 2), 3, 'después de medianoche sigue siendo la noche del día 3');
assert.equal(Math.round(segundosHasta(8.5, 20.5, 30)), 15 * 60, '12 h de juego = 15 min con días de 30 min');
assert.equal(Math.round(segundosHasta(22, 6, 24)), 8 * 60, 'cruza la medianoche');
assert.equal(relojCorto(75), '1:15');

// oleadas: crecen, tienen techo y suman tipos nuevos
let anterior = 0;
for (let n = 1; n <= 12; n++) {
  const o = composicionOleada(n);
  assert.ok(o.length >= anterior && o.length <= 18, `oleada ${n} fuera de rango`);
  assert.ok(o.every((t) => TIPOS_ALIEN[t]), `oleada ${n} con tipo desconocido`);
  anterior = o.length;
}
assert.deepEqual(composicionOleada(1), ['rastreador', 'rastreador', 'rastreador'], 'la primera noche es suave');
assert.ok(composicionOleada(2).includes('bruto'), 'la segunda noche trae un bruto');
assert.ok(composicionOleada(3).includes('tirador'), 'la tercera noche trae tiradores');
assert.ok(multiplicadorNoche(1) === 1 && multiplicadorNoche(6) > 1.3);

// armas y recetas
for (const [id, a] of Object.entries(ARMAS)) assert.ok(((['martillo', 'humo', 'bengala', 'cuerno'].includes(a.tipo)) || a.dano > 0) && a.cadencia > 0, `arma ${id} inválida`);   // 2.5: humo, bengala y cuerno son de apoyo

// ronda 3: mejoras con cristales, noches especiales, clima, tutorial y refuerzos
assert.equal(armaEfectiva('lanza', {}).dano, 34);
assert.equal(armaEfectiva('lanza', { lanzaCristal: 1 }).dano, 52);
assert.ok(armaEfectiva('arco', { arcoReforzado: 1 }).vel > ARMAS.arco.vel);
assert.ok(armaEfectiva('pistola', { pistolaCargada: 1 }).cargado.atraviesa);
assert.equal(nocheEspecial(3, 0.01), null, 'no hay noches especiales antes de la cuarta');
assert.equal(nocheEspecial(6, 0.01, 'roja'), null, 'nunca dos especiales seguidas');
assert.equal(nocheEspecial(NOCHE_FINAL, 0.01), null, 'la noche final no es especial');
assert.equal(nocheEspecial(7, 0.9), null);
assert.ok(Object.keys(ESPECIALES).includes(nocheEspecial(7, 0.1)));
assert.ok(aplicarEspecial(composicionOleada(5), 'roja').length > composicionOleada(5).length);
// la noche 7 no es de jefe: la silenciosa la deja de tiradores puros
assert.ok(aplicarEspecial(composicionOleada(7), 'silenciosa').every((t) => t === 'tirador'));
// detalle de los invasores y del jefe: pruebas/verificar-invasores.mjs
assert.ok(efectoClima({ lluvia: 1 }).vista < 1 && !efectoClima({ lluvia: 1 }).antorchas && efectoClima({ invierno: 1 }).velocidad < 1);
assert.ok(nocheConRestos(3) && nocheConRestos(6) && !nocheConRestos(4));
for (const r of RECETAS) assert.ok(CATEGORIAS_TALLER.some((c) => c.clave === r.cat), `receta ${r.id} sin categoría del taller`);
for (const c of CATEGORIAS_TALLER) assert.ok(RECETAS.filter((r) => r.cat === c.clave).length <= 9, `la categoría ${c.clave} no entra en las teclas 1–9`);
{
  const cons = leer('src/construccion.js');
  for (const [de, r] of Object.entries(REFUERZOS)) assert.ok(cons.includes(`id: '${de}'`) && cons.includes(`id: '${r.a}'`), `refuerzo ${de} → ${r.a} sin plano`);
  for (const p of PLANOS_ALIEN) assert.ok(cons.includes(`requierePlano: '${p.id}'`), `el plano alienígena ${p.id} no desbloquea ninguna pieza`);
}
const tut0 = avanzarTutorial(0, { tronco: 6, tabla: 6, lanza: true, defensas: 0, cuenta: { empalizada: 2 }, oleadas: 0 });
assert.deepEqual(tut0.hechos, ['troncos', 'tablas', 'lanza', 'empalizada']);
// el kit inicial (6 troncos, 6 tablas) no tilda nada solo: hay que talar
assert.deepEqual(avanzarTutorial(0, { tronco: 6, tabla: 6, lanza: false, defensas: 0, cuenta: {}, oleadas: 0 }).hechos, []);
assert.deepEqual(avanzarTutorial(0, { tronco: 10, tabla: 10, lanza: false, defensas: 0, cuenta: {}, oleadas: 0 }).hechos, ['troncos', 'tablas']);
assert.equal(avanzarTutorial(PASOS_TUTORIAL.length, {}).terminado, true);
assert.ok(COMPANEROS.ramon && COMPANEROS.ema && COMPANEROS.ramon.llega.noches < COMPANEROS.ema.llega.noches);
const s3 = sanearDesafio({ planos: ['faro', 'x'], companeros: ['ema', 'ema', 'otro'], recetasHechas: ['lanza', 'nada'], nodriza: { nucleos: [9999, -3, 'a'] } });
assert.deepEqual(s3.planos, ['faro']); assert.deepEqual(s3.companeros, ['ema']); assert.deepEqual(s3.recetasHechas, ['lanza']);
assert.deepEqual(s3.nodriza.nucleos, [NUCLEO_VIDA, 0, 0]);
for (const r of RECETAS) {
  assert.ok(r.id && r.nombre && r.texto, `receta incompleta ${r.id}`);
  for (const k of Object.keys(r.pide)) assert.ok(['tronco', 'tabla', 'piedra', 'cristal', 'ramita', 'fruta'].includes(k), `recurso desconocido ${k} en ${r.id}`);
}
assert.ok(RECETAS.find((r) => r.id === 'lanza') && RECETAS.find((r) => r.id === 'arco') && RECETAS.find((r) => r.id === 'reparar'));

// resistencia: la piedra aguanta más que la madera; reparar cuesta según el daño
const madera = { etapas: [{ pide: { tronco: 4 } }] }, piedra = { etapas: [{ pide: { piedra: 4 } }] };
assert.ok(vidaMaxObra(piedra) > vidaMaxObra(madera));
assert.equal(vidaMaxObra({ vida: 320, etapas: [] }), 320);
assert.deepEqual(costoReparacion(madera, 10, 100), { material: 'tronco', cantidad: 3 });
assert.equal(costoReparacion(madera, 100, 100), null);

// dificultad: cambia cuántos vienen, sin romper la progresión
assert.ok(composicionOleada(4, 'tranquila').length < composicionOleada(4).length);
assert.ok(composicionOleada(4, 'implacable').length > composicionOleada(4).length);
assert.ok(composicionOleada(1, 'tranquila').length >= 2, 'siempre bajan al menos dos');
assert.ok(dificultad('tranquila').dano < 1 && dificultad('implacable').vida > 1 && dificultad('xx') === DIFICULTADES.normal);

// caja del amanecer: crece con las noches y trae flechas sólo si hay arco
const c1 = suministrosDelAlba(1, false), c4 = suministrosDelAlba(4, true);
assert.ok(c4.tronco > c1.tronco && !c1.flechas && c4.flechas > 0 && c4.cristal >= 1 && c4.emplastos === 1);
assert.equal(sanearDesafio({ caja: { x: 1, z: 2, contenido: { tronco: 3 } } }).caja.contenido.tronco, 3);
assert.equal(sanearDesafio({ caja: { x: 'a' } }).caja, null);

// guardado del estado
const s = sanearDesafio({ salud: -5, flechas: 'x', oleadaNoche: 4, oleadaTerminada: false, vivos: 99 });
assert.equal(s.salud, 1); assert.equal(s.flechas, 0); assert.equal(s.oleadaNoche, 4); assert.equal(s.oleadaTerminada, false); assert.equal(s.vivos, 40);
assert.equal(sanearDesafio(null).oleadaNoche, null);
assert.equal(desafioNuevo().emplastos, 1);

// cableado
const guardado = leer('src/guardado.js'), main = leer('src/main.js'), plantilla = leer('src/plantilla.html'), cons = leer('src/construccion.js');
assert.ok(guardado.includes("modo: opcion(x.modo, MODOS, AJUSTES_BASE.modo)"), 'el modo no se guarda en los ajustes');
assert.ok(guardado.includes("(modo === 'relax' ? '' : `-${modo}`)"), 'el Desafío debe tener su propia partida');
assert.ok(main.includes('usarModoGuardado(ajustes.modo, ajustes.ranura)') && main.indexOf('usarModoGuardado(ajustes.modo') < main.indexOf('cargarProgreso()'), 'el modo y la ranura se eligen antes de cargar la partida');
assert.ok(main.includes("if (clave === 'modo' && v !== modoJuego)"), 'cambiar de modo en el menú no recarga el mundo');
assert.ok(main.includes('desafio.atacar(') && main.includes("codigo === 'KeyK' && desafio"), 'faltan ataque o fabricación');
assert.ok(main.includes('desafio.puedeDormir()'), 'dormir no respeta la invasión');
for (const id of ['data-ajuste="dificultad"', 'id="opcion-dificultad"', 'id="fila-dificultad"', 'data-ajuste="modo"', 'id="desafio-hud"', 'id="salud-barra"', 'id="desafio-estado"', 'id="taller"', 'id="taller-lista"', 'id="dano"', 'id="modo-texto"']) {
  assert.ok(plantilla.includes(id), `plantilla sin ${id}`);
}
for (const id of ['empalizada', 'porton-empalizada', 'muro-piedra', 'estacas', 'ballesta-fija']) assert.ok(cons.includes(`id: '${id}'`), `falta la defensa ${id}`);
assert.ok(cons.includes('function destruir(obra)'), 'la construcción no sabe derribar piezas');

// 1.4: invasores de una sola malla con esqueleto en el shader, y optimizaciones del mundo
{
  const alien = leer('src/desafio-alien.js'), veg = leer('src/vegetacion.js'), obj = leer('src/objetos.js'), col = leer('src/colisiones.js');
  assert.ok(alien.includes('uniform mat4 uHuesos[') && /customProgramCacheKey = \(\) => 'invasor-esqueleto-v\d+'/.test(alien), 'el invasor debe resolver su esqueleto en el shader y compartir programa');
  assert.ok(!/new THREE\.Mesh\(/.test(alien.replace(/const malla = new THREE\.Mesh\(geoCerca, mat\);/, '').replace(/const sombra = new THREE\.Mesh\(geoSombra[^;]+;/, '')), 'cada invasor es una malla (más su sombra), no un muñeco de piezas');
  // 1.8: la misma malla cambia a una geometría de menos gajos cuando está lejos
  assert.match(alien, /const geoLejos = construirGeometria\(tipo, DETALLE_LEJOS\)/, 'falta la malla simplificada de lejos');
  assert.match(alien, /malla\.geometry = quiere \? geoLejos : geoCerca/, 'el LOD tiene que cambiar la geometría, no la malla');
  assert.ok(veg.includes('function compactarCercanos(cam)') && veg.includes('m.alta.visible = false;'), 'el LOD cercano de los árboles debe dibujarse compactado');
  assert.ok(obj.includes('function compactar(tipo)') && obj.includes('RADIO_VISTA') && !obj.includes('IcosahedronGeometry(0.03, 1)'), 'los objetos del mapa deben dibujarse sólo cerca y con geometría liviana');
  assert.ok(!col.includes('new Set()') && col.includes('++marcaPasada'), 'resolver() no debe crear un Set por pasada');
}

console.log(`OK Modo Desafío · ${Object.keys(TIPOS_ALIEN).length} invasores · ${Object.keys(ARMAS).length} armas · ${RECETAS.length} recetas · oleadas 3→${composicionOleada(20).length} · partida separada por modo`);
