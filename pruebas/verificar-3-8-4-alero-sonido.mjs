// 3.8.4 (sonido): las decisiones 32, 33 y 34 de DECISIONES_3_8_4.md.
// 32. La Cueva de las Manos pasa a ser «El alero del arriero» (pirca, fogón renegrido, pared tallada, herradura), con
//     la historia chica de Martín y el nombre de su abuelo (alero-arriero.js). Las partidas viejas no pierden nada.
// 33. Las voces de los vecinos: un murmullo cálido, corto y suave que nunca da miedo; los duendes conservan la suya.
// 34. El silbato de la trochita: silbato de vapor con campanas en acorde, soplido, arranque, corte y eco del valle.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as VZ from '../src/social-voz.js';
import { VOCES as VOCES_DUENDES } from '../src/voz-alien.js';
import { SILBATOS } from '../src/personal-trochita.js';
import { SILBATO_PAJARO } from '../src/tren-viaje.js';
import * as AL from '../src/alero-arriero.js';
import { ENTRADA } from '../src/cuaderno.js';
import { LUGARES_VISITA } from '../src/aldea-vida.js';
import { LUGARES_CITA } from '../src/amor.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const RELIGIOSO = /capilla|\bmisa\b|\bcura\b|\bcuras\b|\brez[aoá]|\bdios|\bsant[oa]s?\b|bendi|iglesia|altar|parroq|milagro|virgen|sagrad|ángel|amén|pecado|\balmas?\b/i;

// ============================================================ 33. las voces
{
  const claves = ['aldea-nene', 'aldea-nena', 'pintora', 'aldea-madre', 'aldea-abuela', 'aldea-padre', 'martin', 'ramon', 'ercilia'];
  const textos = ['Hoy bajé al lago temprano y estaba quieto como un espejo.', '¿Vos viste cómo está el tiempo para mañana?', '¡Jaja, qué ocurrencia la tuya!', 'Bueno.',
    'Esto es un renglón larguísimo que dice muchas cosas sobre el tren, la lluvia, la pesca en el lago y lo que pasó ayer en la plaza con el perro.'];
  for (const k of claves) {
    const v = VZ.vozDe(k);
    ok(v.temblor === 0, `${k}: sin temblor (el vibrato de los mayores sonaba a fantasma)`);
    ok(v.aliento > 0 && v.aliento < 0.45, `${k}: con un poco de aire`);
    for (const [i, t] of textos.entries()) {
      const p = VZ.planBalbuceo(t, v, i);
      ok(p.silabas.length >= 2 && p.silabas.length <= 4, `${k} «${t.slice(0, 20)}»: dos a cuatro sílabas (${p.silabas.length})`);
      ok(p.dur <= VZ.BALBUCEO.maxDur + 0.2, `${k}: corto (${p.dur} s)`);
      ok(p.silabas.every((s) => s.cons === null || s.cons === 'm' || s.cons === 'h'), `${k}: sin «s», «ch» ni «t» (los soplidos agudos sonaban a susurro)`);
      ok(p.silabas.every((s) => ['m', 'a', 'e', 'i', 'o'].includes(s.vocal) && s.f0 > 60 && s.f0b > 60), `${k}: vocales y tonos posibles`);
    }
    // nada de saltos raros: ninguna sílaba se va más de un 45 % de la voz de esa persona
    const todos = textos.flatMap((t, i) => VZ.planBalbuceo(t, v, i).silabas);
    ok(todos.every((s) => s.f0 < v.f0 * 1.45 && s.f0b < v.f0 * 1.45 && s.f0 > v.f0 * 0.75), `${k}: el tono no se dispara`);
  }
  ok(VZ.gestoDe('¡Jaja, qué ocurrencia!') === 'risa' && VZ.gestoDe('Me hiciste reír.') === 'risa', 'la risita, cuando hay de qué reírse');
  ok(['eh', 'mm?'].includes(VZ.gestoDe('¿Vamos mañana?')), 'la pregunta es un «¿eh?» o un «¿mm?»');
  ok(['mm-hm', 'a-ha', 'mmm', 'ah'].includes(VZ.gestoDe('Hoy hace frío.')), 'lo dicho, un «mm-hm», un «a-há», un «mmm» o un «ah»');
  const preg = VZ.planBalbuceo('¿Vamos a pescar mañana temprano?', VZ.vozDe('carpintero'), 2);
  ok(preg.silabas.at(-1).f0b > preg.silabas.at(-1).f0 && preg.silabas.at(-1).f0 > preg.silabas[0].f0, 'la pregunta sube al final');
  // la risita de los vecinos no es la de los duendes: abierta, de tres o cuatro sílabas con aire
  const risa = VZ.planBalbuceo('¡Jaja!', VZ.vozDe('aldea-padre'), 1);
  ok(risa.gesto === 'risa' && risa.silabas.every((s) => s.cons === 'h' && s.vocal !== 'i'), 'la risita de un grande, «ja-ja» con aire');
  // el motor
  const s = leer('src/sonido.js');
  const tramo = s.slice(s.indexOf('  balbuceo(plan, {'), s.indexOf('  bramido(pos) {'));
  ok(/vozSuave/.test(tramo) && /'peaking'/.test(tramo) && !/'bandpass'; f1/.test(tramo), 'la voz: glotis relajada y los formantes como realces (la fundamental pasa)');
  ok(!/temblor/.test(tramo), 'el balbuceo ya no tiembla');
  ok(/vozSuave: onda\(serie\(30, \(h\) => Math\.pow\(h, -1\.9\)\)\)/.test(s), 'la onda suave');
  // el murmullo de la plaza es gente, no gargantas
  const mm = leer('src/aldea-mecanicas-mundo.js');
  const mur = mm.slice(mm.indexOf('  function murmullo(p) {'), mm.indexOf('  function ladridoLejos'));
  ok(/balbuceo/.test(mur) && !/garganta/.test(mur), 'el murmullo de la plaza, con la voz de los vecinos');
  // los duendes conservan su voz (voz-alien.js no se tocó: la risita «ji-ji-ji» sigue)
  ok(VOCES_DUENDES.rastreador.risa === 9 && VOCES_DUENDES.saltador.risa === 11.5, 'los duendes, con su risita de siempre');
  ok(/3\.8\.0: la risita de los duendes/.test(s), 'y el motor de su voz, igual');
}

// ============================================================ 34. el silbato
{
  const todos = { ...SILBATOS, pajaro: SILBATO_PAJARO };
  for (const [id, S] of Object.entries(todos)) {
    ok(S.canos.length >= 3, `${id}: tres campanas o más`);
    // un acorde, no los armónicos de una sola nota (520, 780, 1040 era eso)
    const fs0 = S.canos.map(([f]) => f).sort((a, b) => a - b);
    for (let i = 1; i < fs0.length; i++) {
      const r = fs0[i] / fs0[0];
      ok(Math.abs(r - Math.round(r)) > 0.04 || r > 1.9, `${id}: la campana ${fs0[i]} Hz no es un armónico de la primera (${r.toFixed(2)})`);
    }
    ok(S.vibrato > 0 && S.vibrato < 12 && S.soplo > 0, `${id}: la presión y el soplido`);
  }
  ok(SILBATOS.clasico.canos.length === 3 && SILBATOS.grave.canos.length === 5, 'el de siempre, tres campanas; el grave, cinco');
  const s = leer('src/sonido.js');
  const sil = s.slice(s.indexOf('  silbato(pos, tipo = this.silbatoElegido) {'), s.indexOf('  trueno(lejos = 0.5) {'));
  ok(/ecoDelValle\(/.test(sil) && /pitada\(S, t0 \+ cuando/.test(sil), 'cada pitada, con el eco del valle');
  ok(/setValueAtTime\(f \* 0\.8, tc\)/.test(sil), 'el arranque: las campanas arrancan bajas y suben con la presión');
  ok(/setTargetAtTime\(f \* 0\.87, tFin/.test(sil), 'el corte: el tono cae al cerrar la válvula');
  ok(/se cierra: el vapor que queda se escapa/.test(sil), 'y el vapor se escapa');
  ok(/ondas\.campana/.test(sil) && /campana: onda\(/.test(s), 'la campana, un caño cerrado');
  ok((sil.match(/createDelay/g) || []).length === 1 && /\[0\.42, 0\.42, -0\.55, 2200\]/.test(sil), 'cuatro paredes de eco');
}

// ============================================================ 32. el alero del arriero
{
  const est = leer('src/estructuras.js');
  ok(!/Cueva de las Manos'/.test(est) && /cartel\('El alero del arriero'/.test(est), 'el cartel');
  for (const t of ["'J. Miranda 1911'", "'Los Sepúlveda pasaron acá'", "'Fermín Sepúlveda 1927'", 'TorusGeometry', 'la pirca', 'hollinTecho', 'los tizones']) ok(est.includes(t), `en el alero: ${t}`);
  ok(!/manos en negativo y guanacos/.test(est) && !/const guanaco = /.test(est), 'sin las manos ni los guanacos');
  // lo nuevo no tira del sorteo (así nada del valle se mueve)
  const bloque = est.slice(est.indexOf('\n', est.indexOf('// (lo de acá en adelante no tira del sorteo')), est.indexOf('const grupoCueva = new THREE.Group();'));
  ok(bloque.length > 200 && !/\br\(\)/.test(bloque), 'la pirca, el fogón y la herradura no cambian el sorteo');
  ok(/registrarHuella\('cueva', cueva, 9, 5\)/.test(est), 'la misma huella');
  // el cuaderno: la misma entrada (una partida vieja la tiene anotada como 'cueva' y ve la nueva)
  const e = ENTRADA.cueva;
  ok(e && e.nombre === 'El alero del arriero' && /arrieros/.test(e.texto) && /J\. Miranda 1911/.test(e.texto) && /Los Sepúlveda pasaron acá/.test(e.texto) && /herradura/.test(e.texto), 'la entrada del cuaderno');
  ok(!/manos/i.test(e.texto) && !/Cueva de las Manos/.test(JSON.stringify(Object.values(ENTRADA))), 'sin la cueva de las manos en el cuaderno');
  ok(LUGARES_VISITA.cueva.nombre === 'el alero del arriero' && /tallaban su nombre/.test(LUGARES_VISITA.cueva.pide), 'el visitante pregunta por el alero');
  ok(LUGARES_CITA.cueva.nombre === 'el alero del arriero', 'la cita con la pintora');
  const fotos = leer('src/fotos.js');
  ok(/id: 'f-manos', nombre: 'Los nombres tallados'/.test(fotos), 'la foto (el mismo id: la que ya sacaste sigue valiendo)');
  // el inglés de lo que reemplaza claves que ya existían
  const en = ['b', 'e', 'g', 'l'].map((x) => leer(`src/idioma-en-${x}.js`)).join('\n');
  ok(!/Cueva de las Manos'/.test(en) && /'El alero del arriero'/.test(en) && /The Drover's Overhang/.test(en), 'el nombre en inglés');
  ok(en.includes(e.texto.slice(0, 60)) && en.includes('Los nombres tallados') && en.includes('La pared del alero del arriero'), 'el cuaderno y la foto en inglés');

  // la historia de Martín
  const p = { dia: 4 };
  ok(AL.opcionesAlero(p, 'jefe').length === 0, 'sólo Martín');
  ok(AL.opcionesAlero(p, 'martin', { hayAlero: false }).length === 0, 'sin alero en el valle, no pide nada');
  ok(AL.opcionesAlero(p, 'martin')[0]?.id === 'alero:pedir', 'Martín: «¿Sos de familia ferroviaria?»');
  ok(AL.buscarNombre(p, 0.5) === null, 'sin el pedido, el nombre no se «encuentra»');
  const r1 = AL.elegirAlero(p, 'alero:pedir', { dia: 4 });
  ok(r1 && r1.paso === 1 && r1.renglones.length >= 3 && /¿Me lo buscás\?/.test(r1.renglones.at(-1)) && /arriero/.test(r1.renglones[0]), 'te pide que lo busques');
  ok(AL.elegirAlero(p, 'alero:pedir') === null && AL.opcionesAlero(p, 'martin')[0]?.id === 'alero:recordar', 'y después te lo recuerda');
  ok(/a 600 m al noroeste/.test(AL.elegirAlero(p, 'alero:recordar', { rumbo: 'a 600 m al noroeste' }).renglones.join(' ')), 'con el rumbo desde la aldea');
  ok(AL.buscarNombre(p, AL.RADIO_NOMBRE + 1) === null && p.aleroArriero.paso === 1, 'de lejos no se lee');
  const nota = AL.buscarNombre(p, 1, 6);
  ok(nota && nota.titulo.includes(AL.TALLADO_ABUELO) && /Martín/.test(nota.sub) && p.aleroArriero.paso === 2 && p.aleroArriero.dia === 6, 'delante del nombre: lo encontraste');
  ok(AL.buscarNombre(p, 1) === null, 'una sola vez');
  const r3 = AL.elegirAlero(p, 'alero:contar', { dia: 7 });
  ok(r3 && r3.paso === 3 && r3.amistad === AL.AMISTAD_ALERO && r3.diario && r3.renglones.length >= 5, 'y te cuenta de su abuelo (y suma amistad)');
  ok(r3.renglones.join(' ').length > 1500, 'mucho texto bueno');
  ok(AL.opcionesAlero(p, 'martin').length === 0 && AL.elegirAlero(p, 'alero:contar') === null, 'y queda contado');
  const dichos = JSON.stringify(AL.DICHOS_ALERO);
  ok(!RELIGIOSO.test(dichos), `nada religioso (${RELIGIOSO.exec(dichos)?.[0]})`);
  ok(dichos.includes(AL.NOMBRE_ABUELO) && est.includes(`'${AL.TALLADO_ABUELO}'`) && est.includes(`'${AL.TALLADO_FAMILIA}'`), 'lo tallado en la pared es lo que cuenta Martín');
  // un guardado roto o viejo no rompe nada
  for (const x of [null, undefined, 7, 'x', [], { paso: 99, dia: -3 }, { paso: '2', dia: '5' }, { paso: NaN }]) {
    const s = AL.sanearAlero(x);
    ok(Number.isInteger(s.paso) && s.paso >= 0 && s.paso <= 3 && Number.isInteger(s.dia) && s.dia >= 0, `saneo: ${JSON.stringify(x)}`);
  }
  const g = leer('src/guardado.js');
  ok(/aleroArriero: aleroNuevo\(\)/.test(g) && /aleroArriero: modoPartida === 'desafio' \? undefined : sanearAlero\(p\.aleroArriero\)/.test(g), 'en la partida (sólo en el Relax)');
  // el juego: la charla con Martín, el nombre al pasar y el desafío sin nada
  let guardado = 0, notas = [], am = [], diario = [];
  const prog = { dia: 3 };
  const juego = AL.crearAleroJuego({ progreso: () => prog, desafio: () => false, lugar: () => ({ sepulveda: { x: 10, z: 10 } }), jugador: () => ({ x: 10.5, z: 10 }),
    rumbo: () => 'a 300 m al sur', sumarAmistad: (k, x) => am.push([k, x]), diario: (d) => diario.push(d), nota: (t, s2) => notas.push(t), guardar: () => guardado++ });
  ok(juego.opciones('martin')[0].id === 'alero:pedir' && juego.elegir({}, 'alero:pedir').tipo === 'renglones', 'en la charla');
  ok(juego.actualizar(1) && notas.length === 1 && prog.aleroArriero.paso === 2, 'parado delante del nombre, aparece la nota');
  ok(juego.elegir({}, 'alero:contar').renglones.length >= 5 && am[0][0] === 'martin' && diario.length === 1 && guardado >= 3, 'al contarle: amistad, diario y guardado');
  ok(juego.elegir({}, 'alero:pedir').tipo === 'menu', 'lo que ya no corresponde vuelve al menú');
  const desafio = AL.crearAleroJuego({ progreso: () => ({ dia: 1 }), desafio: () => true, lugar: () => ({ sepulveda: { x: 0, z: 0 } }) });
  ok(desafio.opciones('martin').length === 0, 'en el Desafío, nada');
  const vj = leer('src/vecindad-juego.js'), main = leer('src/main.js');
  ok(/ctx\.alero\?\.opciones\?\.\(s\.clave\)/.test(vj) && /\^alero:/.test(vj), 'vecindad-juego.js: lo ofrece y lo elige');
  ok(/alero: aleroJuego,/.test(main) && /aleroJuego\?\.actualizar\(dt\)/.test(main) && /lugar: \(\) => T\.lugares\.cueva/.test(main), 'main.js: lo arma, lo pasa y lo mira cada cuadro');
}

console.log(`OK 3.8.4 alero y sonido · ${n} verificaciones · el alero del arriero y la historia de Martín, voces cálidas, silbato de vapor`);
