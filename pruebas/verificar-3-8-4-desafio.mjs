// 3.8.4 (desafío): las decisiones del usuario sobre «La noche de los duendes» (DECISIONES_3_8_4.md):
//   5. récords del sin fin: diez por dificultad, la dificultad fija en la corrida, los viejos migrados;
//  13. noche 20: si caés con el Coihue en pie, el asedio arranca al alba (no en el momento);
//  14. caer de día: la noche que se saltea cuenta como perdida;
//  27. ladrón trabado: pasado su tiempo de huida suelta lo robado, en cualquier estado;
//  28. el tope de 4 robos por noche se guarda en la partida;
//  29. caer y cerrar durante el fundido: la caída se anota (y se guarda) en el momento.
// Donde se puede, el código de verdad corre en una VM con lo mínimo alrededor.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const raiz = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
// lo que sale de una VM tiene otros prototipos: se compara como datos
const plano = (o) => JSON.parse(JSON.stringify(o));
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
// el texto de una función interna (de `function nombre(` hasta la llave que la cierra, contando llaves)
function extraer(texto, nombre) {
  const i = texto.indexOf(`function ${nombre}(`);
  assert.ok(i >= 0, `no encontré ${nombre}`);
  let n = 0, j = texto.indexOf(') {', i) + 2;
  for (; j < texto.length; j++) { if (texto[j] === '{') n++; else if (texto[j] === '}' && --n === 0) break; }
  return texto.slice(i, j + 1);
}
const des = leer('src/desafio.js');
const main = leer('src/main.js');
const asedioM = leer('src/desafio-asedio-mundo.js');
const S = await import('../src/desafio-supervivencia.js');
const R = await import('../src/desafio-reglas.js');
const DR = await import('../src/desafio-duendes-reglas.js');

// ---------------------------------------------------------------- 5. récords del sin fin
{
  // diez por dificultad: quince corridas de cada una, quedan diez de cada una
  let r = {};
  for (const dif of ['normal', 'implacable', 'tranquila']) for (let i = 0; i < 15; i++) {
    r = S.registrarCorrida(r, { noches: i + (dif === 'tranquila' ? 20 : 0), abatidos: i, fecha: '2026-10-01', codigo: 'LENGA-12', dificultad: dif }).records;
  }
  for (const dif of S.DIFICULTADES_SIN_FIN) {
    assert.equal(S.deDificultad(r.general, dif).length, 10, `diez de ${dif} en la lista general`);
    assert.equal(S.listaDeCodigo(r, 'LENGA-12', dif).length, 10, `y diez de ${dif} con el código`);
  }
  assert.equal(r.general.length, 30);
  // una implacable de 6 noches entra aunque las tranquilas tengan 20 o más: compite sólo con las suyas
  const x = S.registrarCorrida(r, { noches: 14, abatidos: 99, fecha: '2026-10-02', codigo: 'LENGA-12', dificultad: 'implacable' });
  assert.equal(x.puesto, 1, 'el puesto es entre las de su dificultad');
  assert.equal(x.puestoCodigo, 1);
  assert.equal(S.registrarCorrida(r, { noches: 3, fecha: '2026-10-02', dificultad: 'implacable' }).puesto, 0, 'una floja no entra en las suyas');
  assert.equal(S.registrarCorrida({}, { noches: 1, fecha: '2026-10-02', dificultad: 'tranquila' }).puesto, 1);
  assert.deepEqual(S.sanearRecordsSinFin(JSON.parse(JSON.stringify(r))), r, 'ida y vuelta por JSON');
  // los récords viejos (diez mezclados, con o sin dificultad) se migran solos: ninguno se pierde
  const viejos = { general: Array.from({ length: 10 }, (_, i) => ({ noches: 10 - i, abatidos: i, fecha: '2026-09-29', ...(i % 3 ? { dificultad: ['tranquila', 'implacable'][i % 2] } : {}) })),
    porCodigo: { 'COIHUE-1': [{ noches: 2, fecha: '2026-09-01', dificultad: 'implacable' }, { noches: 4, fecha: '2026-09-01' }] } };
  const m = S.sanearRecordsSinFin(viejos);
  assert.equal(m.general.length, 10, 'los diez viejos siguen');
  assert.equal(S.deDificultad(m.general, 'normal').length + S.deDificultad(m.general, 'tranquila').length + S.deDificultad(m.general, 'implacable').length, 10, 'cada uno en la lista de su dificultad');
  assert.ok(m.general.filter((q) => q.dificultad === 'normal').length >= 4, 'sin dificultad anotada, en la normal');
  assert.equal(S.listaDeCodigo(m, 'coihue 1', 'implacable').length, 1);
  assert.equal(S.listaDeCodigo(m, 'coihue 1', 'normal')[0].noches, 4);
  // el resumen dice entre cuáles quedó
  assert.equal(S.resumenCorrida({ noches: 5, abatidos: 2, puesto: 1, dificultad: 'implacable' }).lugar, '¡Tu mejor corrida en Implacable!');
  assert.equal(S.resumenCorrida({ noches: 5, abatidos: 2, puesto: 3, dificultad: 'tranquila' }).lugar, 'Quedó 3.ª entre tus diez mejores en Tranquila.');
  assert.equal(S.lineaRecord({ noches: 3, abatidos: 1, dificultad: 'implacable', fecha: '' }, 0, false), '1. 3 noches · 1 abatidos', 'en una lista de una dificultad no se repite');
  // la corrida guarda su dificultad, y no cambia hasta que termina
  assert.deepEqual(S.corridaNueva(), { terminada: false, dificultad: null }, 'en la portada todavía se elige');
  assert.equal(S.dificultadDeCorrida({ terminada: false, dificultad: 'implacable' }, 'tranquila'), 'implacable', 'fijada: manda la de la corrida');
  assert.equal(S.dificultadDeCorrida({ terminada: false, dificultad: null }, 'tranquila'), 'tranquila', 'sin fijar: la de los ajustes');
  assert.equal(S.dificultadDeCorrida(null, 'cualquiera'), 'normal');
  assert.deepEqual(R.sanearDesafio({ sinFin: { terminada: false, dificultad: 'implacable' } }).sinFin, { terminada: false, dificultad: 'implacable' }, 'se guarda');
  assert.deepEqual(R.sanearDesafio({ sinFin: { terminada: true, dificultad: 'imposible' } }).sinFin, { terminada: true, dificultad: null });
  assert.deepEqual(R.sanearDesafio({ sinFin: { terminada: false } }).sinFin, { terminada: false, dificultad: null }, 'una corrida vieja carga sin dificultad (se fija al entrar)');
  // en el juego: el Desafío pregunta la dificultad de la corrida, se fija al entrar y el botón no la cambia
  assert.ok(main.includes('    dificultad: () => dificultadEnJuego(),'), 'el modo de combate juega con la dificultad de la corrida');
  assert.match(main, /function dificultadEnJuego\(\) \{ return esSinFin \? dificultadDeCorrida\(progreso\.desafio\?\.sinFin, ajustes\.dificultad\) : ajustes\.dificultad; \}/);
  assert.match(extraer(main, 'terminarCorrida'), /codigo: d\.semilla, dificultad: dificultadEnJuego\(\) \}/, 'el récord se anota con la de la corrida');
  assert.match(main, /if \(clave === 'dificultad' && corridaFijada\(\) && v !== dificultadEnJuego\(\)\) \{\n\s*nota\('La dificultad queda fija', TEXTO_DIFICULTAD_FIJA\);\n\s*sincronizarAjustes\(\);\n\s*return;/, 'a mitad de corrida no se cambia');
  assert.match(main, /if \(esSinFin && progreso\.desafio\?\.sinFin && !progreso\.desafio\.sinFin\.terminada && !progreso\.desafio\.sinFin\.dificultad\) \{\n\s*progreso\.desafio\.sinFin\.dificultad = dificultadDeCorrida\(null, ajustes\.dificultad\);/, 'se fija al entrar');
  // (la constante va antes de sincronizarAjustes: si no, al abrir una corrida fijada rompía por la zona muerta)
  assert.ok(main.indexOf("const TEXTO_DIFICULTAD_FIJA") < main.indexOf('function sincronizarAjustes('));
}

// ---------------------------------------------------------------- 13. el asedio arranca al alba
{
  const llamadas = [];
  const ctx = { NOCHE_FINAL: R.NOCHE_FINAL, asedioActivo: () => false, cerrarNocheAsedio: () => ({}), defZona: () => null, setTimeout() {}, Number, Math };
  vm.createContext(ctx);
  vm.runInContext(`var d; const D = () => d; var api = { coihueComun: null };
    function empezar(sitio = null) { llamadas.push(sitio); d.asedio = { activo: true }; d.nodriza = null; return true; }
    ${extraer(asedioM, 'alTerminarNoche')}; ${extraer(asedioM, 'revisarAlba')};
    this.alTerminarNoche = alTerminarNoche; this.revisarAlba = revisarAlba; this.poner = (x, co) => { d = x; api.coihueComun = co; };`, Object.assign(ctx, { llamadas }));
  // caer en la noche 20 con el Coihue plantado: no arranca en el momento, queda anotado dónde está
  const d = { asedio: null, victoria: false, nodriza: { nucleos: [600, 600, 0] }, oleadas: 20, asedioAlAlba: null };
  ctx.poner(d, { fase: 'plantado', g: { visible: true }, x: 61.5, z: -40.2 });
  assert.equal(ctx.alTerminarNoche(false), false);
  assert.equal(llamadas.length, 0, 'caer con el Coihue en pie no planta el asedio en el momento');
  assert.deepEqual(plano(d.asedioAlAlba), { x: 61.5, z: -40.2 }, 'queda esperando el alba, en el lugar del Coihue');
  assert.deepEqual(R.sanearDesafio(JSON.parse(JSON.stringify(d))).asedioAlAlba, { x: 61.5, z: -40.2 }, 'y se guarda');
  assert.deepEqual(R.sanearDesafio({ asedioAlAlba: {} }).asedioAlAlba, {}, 'sin lugar también');
  assert.equal(R.sanearDesafio({ asedioAlAlba: 'x' }).asedioAlAlba, null);
  // de noche todavía no; con la luz (despertás) sí, en ese lugar
  assert.equal(ctx.revisarAlba(true), false);
  assert.equal(llamadas.length, 0, 'mientras sea de noche, espera');
  assert.equal(ctx.revisarAlba(false), true);
  assert.deepEqual(plano(llamadas), [{ x: 61.5, z: -40.2 }], 'al alba arranca, donde quedó el Coihue');
  assert.equal(d.asedioAlAlba, null, 'una sola vez');
  // si aguantaste hasta el alba, como siempre: arranca en ese momento
  const d2 = { asedio: null, victoria: false, nodriza: { nucleos: [600, 600, 600] }, oleadas: 20, asedioAlAlba: null };
  ctx.poner(d2, null);
  ctx.alTerminarNoche(true);
  assert.equal(llamadas.length, 2, 'sobrevivida: el asedio arranca al alba de siempre');
  // en el juego: lo mira revisarHorario (que no corre con vos caído), y empezar usa el lugar guardado
  assert.match(extraer(des, 'revisarHorario'), /if \(d\.asedioAlAlba\) asedioMundo\.revisarAlba\(esHoraDeAtaque\(p\.horas\)\);/);
  assert.ok(des.includes('if (!caido && !naveMundo.adentro) revisarHorario();'), 'caído no arranca nada: arranca al despertar');
  assert.match(extraer(asedioM, 'empezar'), /\|\| guardado \|\| ubicarNave\(c, llano, azar\)/);
}

// ---------------------------------------------------------------- 14. caer de día: la noche salteada se pierde
{
  const registros = [], terminadas = [];
  const ctx = { NUCLEO_VIDA: R.NUCLEO_VIDA, NOCHE_FINAL: R.NOCHE_FINAL, siguenLasNoches: () => true, Math };
  vm.createContext(ctx);
  vm.runInContext(`var d; const D = () => d; const asedioMundo = { alTerminarNoche: (s) => terminadas.push(s) };
    function registrarRecords() { registros.push(d.oleadas); }
    const esNocheFinal = () => !d.victoria && !d.sinFin && !d.asedio && d.oleadas + 1 >= NOCHE_FINAL;
    ${extraer(des, 'perderNocheSalteada')}; this.perder = perderNocheSalteada; this.poner = (x) => { d = x; };`, Object.assign(ctx, { registros, terminadas }));
  const d = { oleadas: 7, racha: 3, oleadaNoche: 7, oleadaTerminada: true, especial: 'roja', especialAnterior: null, sinFin: null, nodriza: null, victoria: false, asedio: null };
  ctx.poner(d);
  assert.equal(ctx.perder(8), 8, 'la noche 8 se saltea y cuenta como perdida');
  assert.deepEqual({ o: d.oleadas, r: d.racha, n: d.oleadaNoche, t: d.oleadaTerminada, e: d.especial, a: d.especialAnterior }, { o: 8, r: 0, n: 8, t: true, e: null, a: 'roja' });
  assert.deepEqual(plano(terminadas), [false], 'como una noche en la que caíste');
  assert.deepEqual(plano(registros), [8]);
  assert.equal(ctx.perder(8), 0, 'una sola vez');
  assert.equal(d.oleadas, 8);
  // la noche final salteada: el Coihue queda en pie (el asedio arranca al alba, ver 13)
  const f = { oleadas: 19, racha: 0, oleadaNoche: 19, oleadaTerminada: true, especial: null, sinFin: null, nodriza: null, victoria: false, asedio: null };
  ctx.poner(f);
  assert.equal(ctx.perder(20), 20);
  assert.deepEqual(plano(f.nodriza), { nucleos: [R.NUCLEO_VIDA, R.NUCLEO_VIDA, R.NUCLEO_VIDA] }, 'el Coihue de la noche final queda en pie');
  // en la corrida sin fin caer termina la corrida (no hay noche que perder)
  ctx.poner({ ...d, oleadaNoche: 1, sinFin: { terminada: false } });
  assert.equal(ctx.perder(9), 0);
  // cuándo se despierta: con el reloj, a la misma hora (nunca se saltea); si no, a la mañana
  const c2 = { ajustes: { duracion: 20 } };
  vm.createContext(c2);
  vm.runInContext(`${extraer(main, 'despertarDeCaida')}; this.f = despertarDeCaida;`, c2);
  assert.deepEqual(plano(c2.f(5, 15)), { dia: 6, horas: 7.2 }, 'de tarde: hasta mañana (se saltea la noche)');
  assert.deepEqual(plano(c2.f(5, 9)), { dia: 5, horas: 7.2 }, 'de mañana: no se saltea nada');
  assert.deepEqual(plano(c2.f(5, 2)), { dia: 5, horas: 7.2 }, 'de madrugada: la noche ya se jugó');
  c2.ajustes.duracion = 'reloj';
  assert.deepEqual(plano(c2.f(5, 15)), { dia: 5, horas: 15 }, 'con la hora de tu reloj no se salta nada');
  assert.match(extraer(main, 'caerEnDesafio'), /const perdida = despierta\.dia > progreso\.dia \? desafio\.perderNocheSalteada\(progreso\.dia\) : 0;/);
  assert.ok(main.includes("nota(`Se te pasó la noche ${perdida}`, 'Caíste de día y dormiste hasta la mañana: esa noche cuenta como perdida', true)"), 'y te lo dice al despertar');
}

// ---------------------------------------------------------------- 27. el ladrón trabado suelta lo robado
{
  const af = extraer(des, 'actualizarAlien');
  const tic = af.indexOf('a.robo.t -= dt;');
  assert.ok(tic > 0 && tic < af.indexOf("if (a.estado === 'dormido')"), 'el tiempo de huida se descuenta antes que cualquier estado');
  assert.equal(af.split('a.robo.t -= dt;').length, 2, 'en un solo lugar');
  assert.ok(tic < af.indexOf('if (a.atrapadoT > 0 || a.enredadoT > 0) {') && tic < af.indexOf("if (a.estado === 'romper') {") && tic < af.indexOf('if (quietoArsenal || ef.quieto) {'), 'trabado, enredado o quieto, el reloj corre igual');
  // con el código de verdad: en el aire (un estado que sale antes de llegar a la huida) igual lo suelta a tiempo
  const soltados = [];
  const ctx = { naveMundo: {}, poseAlien: {}, nocheNivel: 1, T: { altura: () => 0 }, Math, soltarRobo: (a, alcanzado) => { a.robo = null; soltados.push(alcanzado); } };
  vm.createContext(ctx);
  vm.runInContext(`${af}; this.f = actualizarAlien;`, ctx);
  const a = { estado: 'saltar', salto: { x0: 0, x1: 0, z0: 0, z1: 0, y0: 0, y1: 0, dur: 99, alto: 0 }, saltoT: 0, rumbo: 0, def: {},
    flash: 0, fase: 0, tLod: 9, m: { g: { position: { x: 0, y: 0, z: 0 }, rotation: {} }, animar() {}, flash() {}, detalle() {} }, robo: { cosa: 'tabla', n: 1, t: 0.12 } };
  for (let i = 0; i < 4; i++) ctx.f(a, 0.05, { pos: { x: 0, y: 0, z: 0 } }, true);
  assert.deepEqual(plano(soltados), [false], 'pasado el tiempo de huida lo deja tirado (no lo lleva hasta el alba)');
  assert.equal(a.robo, null);
  // la huida (correr para el otro lado) sigue siendo sólo cuando avanza
  assert.ok(af.includes("if (a.robo && a.estado === 'avanzar') { rumboObj = Math.atan2(-dx, -dz); velObj = def.vel * ROBO.velHuida; ataca = false; }"));
}

// ---------------------------------------------------------------- 28. el tope de robos se guarda
{
  const robos = [];
  const armar = () => {
    const ctx = { puedeRobar: DR.puedeRobar, queSeLleva: DR.queSeLleva, ROBO: DR.ROBO, caido: false, NOMBRE_ROBADO: { tabla: 'una tabla' },
      S: { risa() {} }, ctx: { cuanto: () => 99, gastar() {}, nota() {} }, anotarRobado: (k, n) => robos.push(k), Math: { ...Math, random: () => 0 } };
    ctx.Math = Object.assign(Object.create(Math), { random: () => 0 });
    vm.createContext(ctx);
    vm.runInContext(`var d; const D = () => d; ${extraer(des, 'intentarRobo')}; this.robar = intentarRobo; this.poner = (x) => { d = x; };`, ctx);
    return ctx;
  };
  const duende = () => ({ tipo: 'rastreador', m: { viejo: false, g: { position: {} }, robar() {} }, robo: null });
  let juego = armar();
  const d = R.sanearDesafio({ oleadas: 6 });
  assert.deepEqual(d.robosNoche, { noche: -1, n: 0 }, 'una partida vieja arranca sin robos anotados');
  juego.poner(d);
  for (let i = 0; i < 3; i++) juego.robar(duende());
  assert.equal(robos.length, 3);
  // se guarda y se abre a mitad de noche: el contador sigue (antes volvía a cero y se podía robar otras cuatro)
  const abierta = R.sanearDesafio(JSON.parse(JSON.stringify(d)));
  assert.deepEqual(abierta.robosNoche, { noche: 6, n: 3 }, 'los robos de la noche van en la partida');
  juego = armar();
  juego.poner(abierta);
  for (let i = 0; i < 5; i++) juego.robar(duende());
  assert.equal(robos.length, DR.ROBO.porNoche, `como mucho ${DR.ROBO.porNoche} por noche, aunque se recargue`);
  // la noche siguiente vuelve a haber
  abierta.oleadas = 7;
  juego.robar(duende());
  assert.equal(robos.length, DR.ROBO.porNoche + 1, 'otra noche, otro tope');
  assert.ok(!/const robos = \{ noche: -1, n: 0 \};/.test(des), 'sin el contador en memoria');
}

// ---------------------------------------------------------------- 29. caer y cerrar durante el fundido
{
  const guardados = [], timers = [];
  const ctx = {
    esSinFin: false, modoObra: false, mochilaAbierta: false, ajustes: { duracion: 20 },
    progreso: { dia: 4, horas: 22.5, materiales: { cristal: 9, tronco: 10, tabla: 10, piedra: 3 } },
    $: () => ({ classList: { add() {}, remove() {} } }), nota() {}, refrescarBarra() {}, abrirObra() {}, abrirMochila() {},
    puntoBase: () => ({ x: 10, z: 20, yaw: 1, y: null }),
    jugador: { ubicar() {} }, setTimeout: (f) => timers.push(f),
    desafio: { abrirTaller() {}, limpiar() {}, levantarse() {}, perderNocheSalteada: () => 0 },
  };
  vm.createContext(ctx);
  vm.runInContext(`var caidaEnCurso = null;
    function guardar() { guardados.push({ caida: caidaEnCurso && { ...caidaEnCurso }, cristal: progreso.materiales.cristal, tronco: progreso.materiales.tronco }); }
    ${extraer(main, 'despertarDeCaida')}; ${extraer(main, 'caerEnDesafio')}; this.caer = caerEnDesafio; this.enCurso = () => caidaEnCurso;`, Object.assign(ctx, { guardados }));
  ctx.caer();
  // todavía en el fundido (los temporizadores no corrieron): ya se perdió lo que se pierde y ya se guardó
  assert.equal(timers.length, 1, 'el fundido sigue');
  assert.equal(guardados.length, 1, 'la caída se guarda en el momento');
  assert.deepEqual(plano(guardados[0]), { caida: { dia: 5, horas: 7.2, base: { x: 10, z: 20, yaw: 1, y: null } }, cristal: 0, tronco: 7 }, 'con las semillas y parte de los materiales perdidos, despierto a la mañana en la base');
  // al terminar el fundido se aplica lo mismo y se vuelve a guardar
  timers.shift()();
  assert.equal(ctx.enCurso(), null);
  assert.deepEqual([ctx.progreso.dia, ctx.progreso.horas], [5, 7.2]);
  assert.equal(guardados.at(-1).caida, null);
  // guardar en el fundido escribe la partida ya despierta: en la base, a esa hora y con la salud entera
  const g = extraer(main, 'guardar');
  assert.match(g, /const c = caidaEnCurso;\n\s*const aGuardar = c \? \{ \.\.\.progreso, dia: c\.dia, horas: c\.horas, yaw: c\.base\.yaw, pos: /);
  assert.match(g, /desafio: progreso\.desafio \? \{ \.\.\.progreso\.desafio, salud: SALUD_MAX \} : progreso\.desafio \} : progreso;/);
  assert.match(g, /const ok = guardarProgreso\(obrasAjenas\.length \? \{ \.\.\.aGuardar, obras: \[\.\.\.\(aGuardar\.obras \|\| \[\]\), \.\.\.obrasAjenas\] \} : aGuardar\);/);
}


// ---------------------------------------------------------------- pulido visual «pronto» (lo que se puede mirar sin pantalla)
{
  const formas = leer('src/desafio-coihue-formas.js'), nave = leer('src/desafio-nave-mundo.js'), modelo = leer('src/duendes-modelo.js');
  // el Rey con piel por huesos: una malla con esqueleto (hombro, codo y mano en cada brazo), compilada en la carga
  assert.ok(formas.includes("export const HUESOS_REY = ['torso', 'cabeza', 'brazo0', 'codo0', 'mano0', 'brazo1', 'codo1', 'mano1'];"));
  assert.ok(formas.includes('malla.skeleton = new EsqueletoRey(HUESOS_REY.map((h) => huesos[h]), malla);'), 'el Rey lleva piel por huesos');
  assert.ok(formas.includes("geo.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4));"));
  assert.match(extraer(formas, 'testigosCoihue'), /new MallaRey\(geo, m\.material\)/, 'el programa con huesos se compila en la carga');
  assert.ok(nave.includes('ir(h.codo0, o.c0); ir(h.codo1, o.c1); ir(h.mano0, o.m0); ir(h.mano1, o.m1);'), 'las poses doblan los codos');
  // la corteza del Coihue de noche y de lejos, sin programa nuevo
  assert.ok(formas.includes("sh.uniforms.uNocheC = U.uNoche;") && formas.includes("m.customProgramCacheKey = () => 'coihue-corteza-38';"));
  assert.ok(formas.includes('finoC = clamp(1.6 - fwidth(u.x * 1.6) * 3.0, 0.0, 1.0);'), 'de lejos las grietas finas se funden');
  // la lechuza (alas con plumas sueltas, la cara de arriba mirando arriba) y el cofre (la tierra se ve, raíces por el suelo)
  assert.ok(modelo.includes('const espejo = (geo) => {') && modelo.includes('(0.5 - v) * a);   // (así la cara de arriba mira arriba)'));
  assert.ok(modelo.includes('lathe(afinar([[1.0, -0.03], [0.8, 0.0], [0.6, 0.035], [0.4, 0.062], [0.001, 0.08]], 3), 28)'), 'el montículo del cofre mira para arriba');
}

console.log('✓ 3.8.4 (desafío): récords por dificultad, asedio al alba, noche salteada, ladrón trabado, tope de robos y caída en el fundido; pulido: Rey con piel por huesos, corteza, lechuza y cofre');
