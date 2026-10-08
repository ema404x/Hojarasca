// 1.6: los invasores nuevos (saltador y escupidor) y el jefe de nido.
// Composición de las oleadas, números de cada tipo, punto débil del jefe y
// qué defensas puede saltar el saltador.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {
  TIPOS_ALIEN, composicionOleada, sinJefe, esNocheDeJefe, NOCHE_JEFE, NOCHE_FINAL,
  danoEnPuntoDebil, PUNTO_DEBIL, puedeSaltar, ALTURA_SALTO, NO_SALTABLES,
  nocheEspecial, aplicarEspecial, multiplicadorNoche, dificultad, DIFICULTADES,
} from '../src/desafio-reglas.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const cuenta = (lista, tipo) => lista.filter((t) => t === tipo).length;

// ---------------------------------------------------------------- los ocho tipos
// 2.1: el excavador es el séptimo (ver `desafio-valle.js`); 2.3: el volador, el octavo
assert.equal(Object.keys(TIPOS_ALIEN).length, 8, 'tienen que ser ocho tipos de invasor');
assert.ok(TIPOS_ALIEN.excavador?.excava, 'el excavador cava');
assert.ok(TIPOS_ALIEN.volador?.vuela, 'el volador vuela');
for (const [id, d] of Object.entries(TIPOS_ALIEN)) {
  assert.ok(d.nombre && d.vida > 0 && d.vel > 0 && d.cadencia > 0, `el tipo ${id} está incompleto`);
  assert.ok(d.dano > 0 && d.danoObra > 0 && d.radio > 0 && d.altura > 0, `el tipo ${id} tiene números inválidos`);
  assert.ok(Array.isArray(d.cristales) && d.cristales.length === 2 && d.cristales[0] <= d.cristales[1], `cristales mal en ${id}`);
  assert.ok(Number.isFinite(d.retroceso) && d.retroceso >= 0, `retroceso mal en ${id}`);
}

// saltador: más chico, más liviano y más rápido que el rastreador, y pega menos
const { rastreador, bruto, tirador, saltador, escupidor, jefe } = TIPOS_ALIEN;
assert.ok(saltador.vida < rastreador.vida, 'el saltador aguanta menos que el rastreador');
assert.ok(saltador.vel > rastreador.vel, 'el saltador es el más rápido');
assert.ok(saltador.dano < rastreador.dano && saltador.danoObra < rastreador.danoObra, 'el saltador pega poco');
assert.ok(saltador.altura < rastreador.altura && saltador.radio < rastreador.radio, 'el saltador es más chico');
assert.equal(saltador.salta, true, 'el saltador tiene que saltar');
assert.ok(!rastreador.salta && !bruto.salta && !jefe.salta, 'sólo el saltador salta');

// escupidor: lento, vida media, tira de lejos y con arco
assert.ok(escupidor.vel < rastreador.vel && escupidor.vel < tirador.vel, 'el escupidor es lento');
assert.ok(escupidor.vida > tirador.vida && escupidor.vida < bruto.vida, 'el escupidor tiene vida media');
assert.ok(escupidor.aDistancia && escupidor.acido, 'el escupidor pelea a distancia con ácido');
assert.ok(escupidor.distancia > 4 && escupidor.distancia < escupidor.alcance, 'se planta a media distancia, adentro de su alcance');
assert.ok(escupidor.alcance < tirador.alcance, 'el escupidor no llega tan lejos como el tirador');
assert.ok(escupidor.velProyectil > 0 && escupidor.salpicadura > 0, 'al escupitajo le falta velocidad o salpicadura');
assert.ok(escupidor.cuerpo > 0 && escupidor.cuerpo < escupidor.distancia, 'el zarpazo del escupidor es de cerca, no de media distancia');
assert.ok(escupidor.danoObra > tirador.danoObra, 'el ácido come las defensas mucho más que el plasma del tirador');

// jefe: enorme, durísimo, suelta muchos cristales y tiene punto débil
assert.equal(jefe.jefe, true);
assert.ok(jefe.vida >= bruto.vida * 4, 'el jefe tiene que aguantar muchísimo más que el bruto');
// 3.8.0: duendes chiquitos: el grandote ~1 m y el Mandamás ~1,3 m (TALLA_DUENDE)
assert.ok(jefe.altura > bruto.altura * 1.2 && jefe.radio > bruto.radio, 'el jefe es mucho más grande');
assert.ok(jefe.dano > bruto.dano && jefe.danoObra > bruto.danoObra, 'el jefe pega más fuerte que el bruto');
assert.ok(jefe.vel <= bruto.vel, 'el jefe no es rápido');
assert.ok(jefe.cristales[0] >= 10, 'al caer el jefe suelta muchos cristales');
assert.ok(jefe.puntoDebil && jefe.pesado && jefe.giro < 6, 'el jefe necesita punto débil, peso y giro lento para poder rodearlo');
assert.ok(bruto.pesado && !rastreador.pesado && !saltador.pesado, 'sólo los pesados aguantan las boleadoras');

// ---------------------------------------------------------------- noches del jefe
assert.equal(NOCHE_JEFE, 5);
for (const n of [5, 10, 15, 20]) assert.ok(esNocheDeJefe(n), `la noche ${n} tiene que ser de jefe`);
for (const n of [1, 2, 3, 4, 6, 9, 11, 14, 19, 21]) assert.ok(!esNocheDeJefe(n), `la noche ${n} no es de jefe`);
assert.ok(esNocheDeJefe(NOCHE_FINAL), 'la noche final también trae jefe');

for (const clave of Object.keys(DIFICULTADES)) {
  for (let n = 1; n <= 20; n++) {
    const o = composicionOleada(n, clave);
    const jefes = cuenta(o, 'jefe');
    assert.equal(jefes, esNocheDeJefe(n) ? 1 : 0, `noche ${n} en ${clave}: ${jefes} jefes`);
    if (jefes) assert.equal(o[o.length - 1], 'jefe', 'el jefe va siempre último');
  }
}
// el jefe ocupa el lugar de un invasor común: la noche del jefe no viene más gente
assert.equal(composicionOleada(5).length, 11, 'la noche 5 sigue siendo de once invasores');
assert.equal(composicionOleada(4).length, 9);

// ---------------------------------------------------------------- composición por noche
let anterior = 0;
for (let n = 1; n <= 20; n++) {
  const o = composicionOleada(n);
  assert.ok(o.every((t) => TIPOS_ALIEN[t]), `noche ${n} con un tipo desconocido`);
  assert.ok(o.length >= anterior && o.length <= 18, `noche ${n}: la oleada se sale de rango (${o.length})`);
  anterior = o.length;
}
for (let n = 1; n <= 2; n++) assert.equal(cuenta(composicionOleada(n), 'saltador'), 0, 'los saltadores no vienen las dos primeras noches');
for (let n = 1; n <= 5; n++) assert.equal(cuenta(composicionOleada(n), 'escupidor'), 0, 'los escupidores no vienen antes de la noche 6');
assert.ok(cuenta(composicionOleada(3), 'saltador') >= 1, 'desde la noche 3 vienen saltadores');
assert.ok(cuenta(composicionOleada(6), 'escupidor') >= 1, 'desde la noche 6 vienen escupidores');
assert.ok(cuenta(composicionOleada(12), 'saltador') >= cuenta(composicionOleada(4), 'saltador'), 'los saltadores crecen con las noches');
// con las noches crece la dureza de todos
assert.ok(multiplicadorNoche(10) > multiplicadorNoche(5) && multiplicadorNoche(1) === 1);
// en Tranquila viene menos gente, pero el jefe baja igual
assert.ok(composicionOleada(10, 'tranquila').length < composicionOleada(10, 'implacable').length);
assert.equal(cuenta(composicionOleada(10, 'tranquila'), 'jefe'), 1);
assert.ok(dificultad('implacable').vida > 1, 'en Implacable los invasores aguantan más');

// refuerzos de madrugada y lo que larga la nodriza: nunca un segundo jefe
assert.equal(cuenta(sinJefe(composicionOleada(10)), 'jefe'), 0);
assert.equal(sinJefe(composicionOleada(4)).length, composicionOleada(4).length, 'sin jefe no saca nada');

// noches especiales: no se juntan con el jefe, y si se aplican no lo duplican
for (const n of [5, 10, 15]) assert.equal(nocheEspecial(n, 0.01), null, `la noche ${n} es del jefe, no especial`);
assert.ok(Object.keys(nocheEspecial(7, 0.1) ? { [nocheEspecial(7, 0.1)]: 1 } : {}).length === 1, 'la noche 7 sí puede ser especial');
for (const esp of ['roja', 'eclipse', 'silenciosa']) {
  const o = aplicarEspecial(composicionOleada(10), esp);
  assert.equal(cuenta(o, 'jefe'), 1, `la ${esp} no puede duplicar al jefe`);
  assert.equal(o[o.length - 1], 'jefe');
}
assert.ok(aplicarEspecial(composicionOleada(7), 'silenciosa').every((t) => t === 'tirador'));

// ---------------------------------------------------------------- punto débil del jefe
// los sacos están modelados entre el 75% y el 97% de la altura declarada del jefe
const atras = { alturaRel: 0.8, porDetras: true };
const frente = { alturaRel: 0.8, porDetras: false };
assert.equal(PUNTO_DEBIL.multiplicador, 2);
assert.equal(danoEnPuntoDebil(jefe, 50, atras), 100, 'en los sacos de la espalda el jefe recibe el doble');
assert.equal(danoEnPuntoDebil(jefe, 50, frente), 50, 'de frente el caparazón aguanta lo normal');
assert.equal(danoEnPuntoDebil(jefe, 50, { alturaRel: 0.95, porDetras: true }), 100, 'la parte de arriba de los sacos también cuenta');
assert.equal(danoEnPuntoDebil(jefe, 50, { alturaRel: 0.1, porDetras: true }), 50, 'abajo de los sacos no hay bonificación');
assert.equal(danoEnPuntoDebil(jefe, 50, { alturaRel: 1.3, porDetras: true }), 50, 'un tiro que le pasa por arriba tampoco');
assert.equal(danoEnPuntoDebil(jefe, 50, null), 50, 'sin punto de impacto no hay bonificación');
assert.equal(danoEnPuntoDebil(jefe, 50, { alturaRel: 'x', porDetras: true }), 50);
for (const d of [rastreador, bruto, tirador, saltador, escupidor]) assert.equal(danoEnPuntoDebil(d, 50, atras), 50, 'sólo el jefe tiene punto débil');
assert.ok(PUNTO_DEBIL.desde >= 0.4 && PUNTO_DEBIL.hasta <= 1, 'la franja del punto débil tiene que caer sobre el cuerpo');
assert.ok(PUNTO_DEBIL.desde < 0.75 && PUNTO_DEBIL.hasta > 0.9, 'la franja tiene que cubrir los hongos de luz de la joroba (duendes-modelo.js; ver verificar-3-8-duendes.mjs)');

// ---------------------------------------------------------------- qué salta el saltador
// Las alturas salen del plano real de cada defensa en construccion.js.
const cons = leer('src/construccion.js');
function planoDefensa(id) {
  const i = cons.indexOf(`id: '${id}'`);
  assert.ok(i > 0, `no existe la defensa ${id}`);
  const m = cons.slice(i, i + 400).match(/alto: ([\d.]+)/);
  assert.ok(m, `la defensa ${id} no declara alto`);
  return { id, alto: Number(m[1]) };
}
const empalizada = planoDefensa('empalizada');
const reforzada = planoDefensa('empalizada-reforzada');
const pirca = planoDefensa('muro-piedra');
const almenado = planoDefensa('muro-almenado');
const porton = planoDefensa('porton-empalizada');
const estacas = planoDefensa('estacas');
assert.ok(puedeSaltar(empalizada), 'el saltador pasa por encima de la empalizada');
assert.ok(puedeSaltar(pirca), 'y por encima de la pirca, que es más baja');
assert.ok(puedeSaltar(estacas), 'las estacas no lo frenan por altura');
assert.ok(!puedeSaltar(reforzada), 'la empalizada reforzada no se salta');
assert.ok(!puedeSaltar(almenado), 'el muro almenado no se salta');
assert.ok(!puedeSaltar(porton), 'el portón cerrado no se salta');
assert.ok(!puedeSaltar({ id: 'torre', alto: ALTURA_SALTO + 0.01 }), 'nada más alto que el tope se salta');
assert.ok(puedeSaltar({ id: 'banco', alto: ALTURA_SALTO }), 'justo en el tope todavía pasa');
assert.ok(!puedeSaltar(null) && !puedeSaltar(undefined));
for (const id of NO_SALTABLES) assert.ok(cons.includes(`id: '${id}'`), `la defensa insaltable ${id} no existe`);
assert.ok(empalizada.alto <= ALTURA_SALTO && reforzada.alto > empalizada.alto, 'reforzar la empalizada tiene que servir contra el saltador');

// ---------------------------------------------------------------- cableado con el juego
{
  // 3.8.0: los invasores son duendes: los modelos en duendes-modelo.js, el dibujo en desafio-duendes.js
  const alien = leer('src/desafio-duendes.js'), modelo = leer('src/duendes-modelo.js'), desafio = leer('src/desafio.js');
  for (const t of ['saltador', 'escupidor', 'jefe']) assert.ok(new RegExp(`^  ${t}: \\(`, 'm').test(modelo), `falta el modelo del ${t}`);
  assert.ok(modelo.includes('parte: PARTE.debil') && alien.includes('vParteD'), 'los hongos del jefe se marcan como punto débil y viajan por un varying');
  // La clave es fija —todos los tipos comparten el programa compilado—, pero sube de
  // versión cada vez que el shader cambia, así que se mira la forma, no el número.
  assert.match(alien, /customProgramCacheKey = \(\) => 'duendes-esqueleto-\d+'/, 'los tipos nuevos comparten el programa del esqueleto');
  assert.equal((alien.match(/customProgramCacheKey/g) || []).length, 1, 'hay más de una clave de programa: los invasores dejarían de compartirlo');
  assert.ok(!/\bfragmentShader[\s\S]*?\baHuesoParte\b[\s\S]*?customProgramCacheKey/.test(alien), 'el atributo aHuesoParte no puede leerse en el fragment shader');
  assert.ok(modelo.includes('joroba: 1') && modelo.includes("objeto: 'calabaza'") && modelo.includes("objeto: 'pala'"), 'faltan los rasgos propios de los tipos nuevos');
  assert.ok(desafio.includes("a.estado === 'saltar'") && desafio.includes('function intentarSaltar'), 'el salto no está en el bucle del invasor');
  assert.ok(desafio.includes("lanzarProyectil('acido'") && desafio.includes('function salpicarAcido'), 'falta el escupitajo de ácido');
  assert.ok(desafio.includes('danoEnPuntoDebil(a.def, dano, impacto)'), 'herirAlien no aplica el punto débil');
  assert.ok(desafio.includes("classList.toggle('jefe'") && desafio.includes("b.className = 'vida-alien'"), 'la barra del jefe tiene que reusar .vida-alien');
  assert.ok(!leer('src/plantilla.html').includes('barra-jefe'), 'la barra del jefe no agrega nada al HTML');
}

console.log(`OK invasores · ${Object.keys(TIPOS_ALIEN).length} tipos (saltador ${saltador.vida} pv, escupidor ${escupidor.vida} pv, jefe ${jefe.vida} pv ×${PUNTO_DEBIL.multiplicador} en los sacos) · jefe cada ${NOCHE_JEFE} noches · oleada 20: ${composicionOleada(20).length} invasores`);
