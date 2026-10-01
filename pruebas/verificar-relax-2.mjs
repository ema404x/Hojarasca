// 2.0: las diez mejoras del Relax, en lo que tienen de lógica pura.
// Las partidas reales están en `pruebas/humo-relax-2.cjs`.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {
  POSTURAS_CALMA, posturaDe, avanzarCalma, calmaDe, quietoDeVerdad, TOLERANCIA_MOVIMIENTO,
  CURIOSIDAD, puntoDeCuriosidad, percepcionMamifero, firmaSonoraJugador,
} from '../src/percepcion.js';
import { ALCANCE_OIDO, QUE_SE_OYE, rumboDe, queCantaCerca, afinarOido, mezclaAlEscuchar, textoEscucha } from '../src/oido.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');

// ======================================================== 1. sentarse y esperar
{
  const quieto = (postura, seg) => {
    const js = { velocidadActual: 0, sentado: postura === 'sentado', agachado: postura === 'agachado' };
    for (let t = 0; t < seg; t += 0.1) avanzarCalma(js, 0.1);
    return js;
  };
  // sentado es lo más calmo; de pie, lo menos
  assert.ok(Math.abs(calmaDe(quieto('sentado', 30)) - 1) < 1e-9, 'sentado y quieto medio minuto, calma completa');
  assert.ok(calmaDe(quieto('agachado', 60)) <= POSTURAS_CALMA.agachado.tope + 1e-9);
  assert.ok(calmaDe(quieto('pie', 90)) <= POSTURAS_CALMA.pie.tope + 1e-9, 'de pie nunca se llega a la calma entera');
  assert.ok(calmaDe(quieto('sentado', 10)) > calmaDe(quieto('pie', 10)), 'sentarse calma más rápido');
  // los primeros segundos no cuentan: pararse un momento no es esperar
  assert.equal(calmaDe(quieto('sentado', 2.5)), 0);
  assert.equal(posturaDe({ sentado: true, agachado: true }), 'sentado');
  // moverse la corta... pero moverse de verdad, no un temblor de un cuadro
  const js = quieto('sentado', 30);
  js.velocidadActual = 1; avanzarCalma(js, 0.05); js.velocidadActual = 0; avanzarCalma(js, 0.05);
  assert.ok(calmaDe(js) > 0.9, 'un temblor de un cuadro no rompe la paciencia');
  js.velocidadActual = 1; for (let i = 0; i < 10; i++) avanzarCalma(js, 0.05);
  assert.equal(calmaDe(js), 0, 'caminar medio segundo sí la rompe');
  assert.ok(!quietoDeVerdad(js));
  js.velocidadActual = 0; js.movido = 0; assert.ok(quietoDeVerdad(js));
  assert.ok(!quietoDeVerdad({ enKayak: true }), 'en el kayak no se está quieto');
  assert.ok(TOLERANCIA_MOVIMIENTO > 0.1 && TOLERANCIA_MOVIMIENTO < 1);

  // la curiosidad: sólo con calma, sólo de lejos a cerca, y a una distancia prudente
  const siempre = () => 0;                          // un azar que siempre dice que sí
  assert.equal(puntoDeCuriosidad({ x: 40, z: 0 }, { x: 0, z: 0 }, 0.3, 0.9, siempre), null, 'sin calma no se acerca');
  assert.equal(puntoDeCuriosidad({ x: 90, z: 0 }, { x: 0, z: 0 }, 1, 0.9, siempre), null, 'de muy lejos no se entera');
  assert.equal(puntoDeCuriosidad({ x: 40, z: 0 }, { x: 0, z: 0 }, 1, 0, siempre), null, 'una especie sin curiosidad no viene nunca');
  for (let i = 0; i < 200; i++) {
    const p = puntoDeCuriosidad({ x: 40, z: 10 }, { x: 0, z: 0 }, 1, CURIOSIDAD.pudu);
    if (!p) continue;
    const d = Math.hypot(p.x, p.z);
    assert.ok(d >= 7 - 1e-9 && d <= 11 + 1e-9, `se queda entre 7 y 11 metros (${d})`);
    assert.ok(p.x > 0, 'y del lado de donde venía');
  }
  // si ya está cerca y seguís quieto, se queda por ahí
  assert.ok(puntoDeCuriosidad({ x: 9, z: 0 }, { x: 0, z: 0 }, 1, 0.9, () => 0.99), 'ya cerca, no se vuelve');
  assert.ok(CURIOSIDAD.pudu && CURIOSIDAD.huemul, 'el pudú y el huemul son curiosos');

  // un jugador calmo casi no se ve ni se oye
  const T = { indice: () => 0, bosque: [0.3], pasto: [0.2] };
  // a ocho metros: lo bastante cerca para que un jugador nervioso asuste
  const nervioso = percepcionMamifero(T, { x: 8, z: 0 }, { pos: { x: 0, z: 0 }, velocidadActual: 0 }, {}, 18, 24);
  const calmo = percepcionMamifero(T, { x: 8, z: 0 }, { pos: { x: 0, z: 0 }, velocidadActual: 0, sentado: true, quietud: 60 }, {}, 18, 24);
  assert.ok(nervioso.riesgo > 0.2, `de pie y recién llegado, a ocho metros el animal ya se inquieta (${nervioso.riesgo.toFixed(2)})`);
  assert.ok(calmo.radioVisual < nervioso.radioVisual * 0.3, 'calmo, el radio visual se achica a menos de un tercio');
  assert.ok(calmo.riesgo < nervioso.riesgo * 0.5, `y el riesgo que siente el animal baja a menos de la mitad (${calmo.riesgo.toFixed(2)})`);
}

// ======================================================== 2. escuchar con atención
{
  assert.ok(ALCANCE_OIDO.escuchando > ALCANCE_OIDO.pasando * 2, 'escuchando, el oído llega más del doble de lejos');
  // el norte del juego es -z y el este +x, igual que la brújula
  assert.equal(rumboDe({ x: 0, z: 0 }, { x: 0, z: -10 }), 'norte');
  assert.equal(rumboDe({ x: 0, z: 0 }, { x: 10, z: 0 }), 'este');
  assert.equal(rumboDe({ x: 0, z: 0 }, { x: 0, z: 10 }), 'sur');
  assert.equal(rumboDe({ x: 0, z: 0 }, { x: -10, z: 0 }), 'oeste');
  assert.equal(rumboDe({ x: 0, z: 0 }, { x: 10, z: -10 }), 'noreste');
  // lo más cercano que falta anotar
  const fuentes = [{ especie: 'chucao', x: 50, z: 0 }, { especie: 'carpintero', x: 20, z: 0 }, { especie: 'chucao', x: 0, z: 200 }];
  assert.equal(queCantaCerca(fuentes, { x: 0, z: 0 }, {}).especie, 'carpintero');
  assert.equal(queCantaCerca(fuentes, { x: 0, z: 0 }, { carpintero: {} }).especie, 'chucao', 'lo anotado no se señala');
  assert.equal(queCantaCerca(fuentes, { x: 0, z: 0 }, { carpintero: {}, chucao: {} }), null, 'si está todo anotado, nada');
  assert.equal(queCantaCerca([{ especie: 'chucao', x: 300, z: 0 }], { x: 0, z: 0 }, {}), null, 'fuera de alcance, nada');
  // el oído se afina de a poco y se sostiene arriba: nada de diente de sierra
  let a = 0;
  for (let i = 0; i < 40; i++) a = afinarOido(a, true, true, 0.1);
  assert.equal(a, 1, 'se afina hasta arriba');
  for (let i = 0; i < 40; i++) {
    a = afinarOido(a, true, true, 0.2);
    assert.equal(a, 1, 'y se sostiene: con el oído afinado no se puede desplomar (diente de sierra de la primera versión)');
  }
  assert.ok(afinarOido(1, true, false, 0.2) < 0.5, 'moverse lo corta rápido');
  assert.ok(afinarOido(1, false, true, 0.2) < 0.5, 'pararse también');
  assert.equal(afinarOido(0, false, false, 0.2), 0);
  // el bosque se corre pero no se apaga
  const m = mezclaAlEscuchar(1);
  assert.ok(m.ambiente > 0.2 && m.ambiente < 0.5, 'el ambiente baja a menos de la mitad sin apagarse');
  assert.ok(m.musica < m.ambiente, 'la música se corre más que el bosque');
  assert.deepEqual(mezclaAlEscuchar(0), { ambiente: 1, musica: 1 });
  // el texto dice qué, cuán lejos y hacia dónde
  assert.match(textoEscucha({ especie: 'chucao', d: 70, rumbo: 'oeste' }), /^Se oye un chucao, lejos, hacia el oeste\.$/);
  assert.match(textoEscucha({ especie: 'carpintero', d: 10, rumbo: 'norte' }), /golpeteo doble, muy cerca/);
  assert.match(textoEscucha(null), /nada que no tengas anotado/);
  for (const k of Object.keys(QUE_SE_OYE)) assert.ok(typeof QUE_SE_OYE[k] === 'string');
}

// ======================================================== 3. el perro como guía
{
  const { OLFATO, MARCAR_DESDE, ESPERAR_SI_LEJOS, idCuaderno, presaParaGuiar, puntoDeGuia, pasoDeGuia } = await import('../src/perro-guia.js');
  assert.ok(OLFATO > 26, 'huele más lejos de lo que marcaba de pasada');
  assert.equal(idCuaderno('pato'), 'patotorrente', 'el pato se anota como pato de los torrentes');
  assert.equal(idCuaderno('pudu'), 'pudu');
  const s = (tipo, x, z) => ({ tipo, pos: { x, z } });
  const fauna = (id) => ['pudu', 'huemul', 'patotorrente'].includes(id);
  const lista = [s('huemul', 30, 0), s('pudu', 20, 0), s('perro', 5, 0), s('pato', 10, 0), s('piedra', 8, 0)];
  // lo más cercano que falta anotar, sin contar al propio perro ni lo que no es fauna
  assert.equal(presaParaGuiar(lista, { x: 0, z: 0 }, {}, fauna).id, 'patotorrente');
  assert.equal(presaParaGuiar(lista, { x: 0, z: 0 }, { patotorrente: {} }, fauna).id, 'pudu');
  assert.equal(presaParaGuiar(lista, { x: 0, z: 0 }, { patotorrente: {}, pudu: {}, huemul: {} }, fauna), null, 'con todo anotado no guía');
  assert.equal(presaParaGuiar([s('pudu', 80, 0)], { x: 0, z: 0 }, {}, fauna), null, 'más allá del olfato, nada');
  assert.equal(presaParaGuiar([s('pudu', 2, 0)], { x: 0, z: 0 }, {}, fauna), null, 'lo que tiene encima no lo guía: lo marca');
  // va a un punto antes del animal, de este lado, para no espantarlo
  const p = puntoDeGuia({ x: 0, z: 0 }, { x: 40, z: 0 });
  assert.ok(p.x < 40 && p.x > 25 && Math.abs(p.z) < 1e-9, `se frena antes del animal (${p.x})`);
  assert.deepEqual(puntoDeGuia({ x: 35, z: 0 }, { x: 40, z: 0 }), { x: 35, z: 0 }, 'si ya está cerca, no se acerca más');
  // qué hace según dónde está cada uno
  assert.equal(pasoDeGuia({ dPerroPresa: MARCAR_DESDE - 1, dPerroJugador: 30, dJugadorPresa: 40 }), 'marcar');
  assert.equal(pasoDeGuia({ dPerroPresa: 30, dPerroJugador: ESPERAR_SI_LEJOS + 5, dJugadorPresa: 50 }), 'esperar', 'si te quedaste atrás, te espera');
  assert.equal(pasoDeGuia({ dPerroPresa: 30, dPerroJugador: 5, dJugadorPresa: 34 }), 'guiar');
  assert.equal(pasoDeGuia({ dPerroPresa: 30, dPerroJugador: 20, dJugadorPresa: 15 }), 'guiar', 'si vos ya estás más cerca que él, no te espera');
}

// ======================================================== 4. encargos de temporada
{
  const T = await import('../src/encargos-temporada.js');
  const { ENCARGOS } = await import('../src/encargos.js');
  const L = T.ENCARGOS_TEMPORADA;
  assert.equal(new Set(L.map((e) => e.id)).size, L.length, 'no hay ids repetidos');
  for (const e of L) {
    assert.ok(!ENCARGOS.some((x) => x.id === e.id), `${e.id} no pisa uno de la lista principal`);
    assert.ok(T.ESTACIONES.includes(e.temporada), `${e.id}: estación válida`);
    assert.ok(['ema', 'ramon', 'nicanor', 'guarda'].includes(e.quien), `${e.id}: vecino válido`);
    assert.ok(e.pedido && e.resumen && e.listo && e.titulo && e.premio?.texto, `${e.id}: textos y premio completos`);
    assert.ok(e.meta?.contador && e.meta.cantidad > 0, `${e.id}: tiene algo para contar`);
    assert.equal(typeof e.cumplido, 'function', `${e.id}: se lo puede tratar como a los otros`);
  }
  for (const est of T.ESTACIONES) assert.equal(L.filter((e) => e.temporada === est).length, 2, `dos por estación (${est})`);
  // la lista principal y el cierre no se enteran: el cierre sigue pidiendo sólo lo suyo
  const { ENCARGO } = await import('../src/encargos.js');
  assert.ok(ENCARGO['e-valle'].requiere.every((id) => !id.startsWith('t-')), 'el cierre no pide encargos de temporada');

  assert.equal(T.estacionDe({ invierno: 1 }), 'invierno');
  assert.equal(T.estacionDe({ otono: 1 }), 'otono');
  assert.equal(T.estacionDe({}), 'verano');
  // contar: los peces se guardan como { cantidad, record }
  const c = T.contadores({ renovales: [1, 2], talados: [1], fotos: 3, vueltas: 1, peces: { arcoiris: { cantidad: 2 }, marron: { cantidad: 1 } } });
  assert.deepEqual(c, { renovales: 2, talados: 1, fotos: 3, vueltas: 1, peces: 3 });

  const cerrado = () => ({ encargos: { 'e-valle': 'hecho' }, renovales: [1, 2, 3, 4], talados: [], fotos: 0, vueltas: 0, peces: {} });
  // antes del cierre no hay nada
  assert.equal(T.encargoDeTemporada({ encargos: {} }, 'ema', 'verano'), null, 'antes del cierre no se ofrece nada');
  // después, sólo lo de la estación
  const p = cerrado();
  assert.equal(T.encargoDeTemporada(p, 'ema', 'verano').e.id, 't-renovales');
  assert.equal(T.encargoDeTemporada(p, 'ema', 'otono').e.id, 't-coloradas');
  assert.equal(T.encargoDeTemporada(p, 'ramon', 'verano'), null, 'Ramón no tiene nada en verano');
  // aceptado: lo que ya había no cuenta
  const e = T.ENCARGO_TEMPORADA['t-renovales'];
  p.encargos[e.id] = 'pedido'; T.anotarBase(p, e);
  assert.equal(T.avance(p, e), 0);
  assert.ok(!e.cumplido(p), 'los cuatro renovales de antes no cuentan');
  p.renovales.push(5, 6);
  assert.ok(!e.cumplido(p), 'con dos nuevos todavía no');
  p.renovales.push(7);
  assert.ok(e.cumplido(p), 'con tres nuevos, sí');
  // se cobra aunque haya cambiado la estación: lo aceptaste y lo hiciste
  assert.equal(T.encargoDeTemporada(p, 'ema', 'invierno').modo, 'listo', 'se cobra en cualquier estación');
  // sin base anotada (un guardado raro) no se cumple solo
  assert.equal(T.avance({ renovales: [1, 2, 3, 4, 5, 6] }, e), 0);
  // hecho: no se vuelve a ofrecer
  p.encargos[e.id] = 'hecho';
  assert.equal(T.encargoDeTemporada(p, 'ema', 'verano'), null, 'hecho, no se repite');
  const r = T.resumenTemporada(p, 'verano');
  assert.equal(r.hechos, 1); assert.equal(r.total, 6);
  // el saneo del guardado
  assert.deepEqual(T.sanearBase({ 't-renovales': { renovales: 4, fotos: 'x', peces: -2 }, 'no-existe': { renovales: 1 }, 't-lena': null }),
    { 't-renovales': { renovales: 4 } }, 'sólo números válidos de encargos que existen');
  assert.deepEqual(T.sanearBase(null), {});
}

// ======================================================== 5. la huerta
// 2.2: la huerta de la 2.0 (frutillas y calafates que se riegan) y la de la 1.10 (habas,
// papas y frutillas con semilla) quedaron en una sola, la de la 1.10, con los calafates.
// Lo que se prueba acá es lo que la 2.0 prometía y sigue valiendo.
{
  const Hu = await import('../src/huerta.js');
  const { CULTIVOS } = Hu;
  // sembrás uno y cosechás más: para eso se tiene una huerta
  for (const [k, c] of Object.entries(CULTIVOS)) {
    assert.ok(c.cosecha > 1, `${k}: la cosecha rinde más que la semilla`);
    assert.ok(c.dias > 1, `${k}: no se hace en un día`);
  }
  // se siembra con una frutilla o un calafate que juntaste
  const tengo = (m) => (k) => m[k] || 0;
  assert.equal(Hu.semillaParaSembrar(tengo({})), null, 'sin semilla no se siembra');
  assert.deepEqual(Hu.semillaParaSembrar(tengo({ calafate: 1 })), { cultivo: 'calafates', gasta: 'calafate', conIngrediente: true });
  assert.equal(Hu.semillaParaSembrar(tengo({ frutilla: 1, calafate: 1 })).cultivo, 'frutillas', 'con las dos, primero frutilla');
  // nada se muere: pasan los días y queda para cosechar hasta que vuelvas
  const h = {};
  Hu.sembrar(h, '0:0', 'calafates', 10);
  assert.equal(Hu.lista(h['0:0'], 12), false);
  assert.equal(Hu.lista(h['0:0'], 13), true);
  assert.equal(Hu.lista(h['0:0'], 60), true, 'si te olvidás, espera');
  // la lluvia la adelanta
  Hu.regarConLluvia(h, 11);
  assert.equal(Hu.lista(h['0:0'], 12), true);
  const cos = Hu.cosechar(h, '0:0', 12);
  assert.equal(cos.ingrediente, 'calafate'); assert.equal(cos.cantidad, CULTIVOS.calafates.cosecha);
  assert.deepEqual(h, {}, 'el cantero queda vacío');
  // los canteros de una partida de la 2.x siguen creciendo donde estaban
  const viejo = Hu.desdeCanteroViejo({ planta: 'frutilla', crecido: 2 / 3, agua: 5 }, 20);
  assert.deepEqual(viejo, { cultivo: 'frutillas', dia: 18, lluvia: 0, ultimaLluvia: -1 });
  assert.equal(Hu.desdeCanteroViejo({ planta: null }, 20), null);
  assert.equal(Hu.desdeCanteroViejo({ planta: 'tomate', crecido: 1 }, 20), null);
  const g = leer('src/guardado.js');
  assert.ok(g.includes('p = migrarCanteros(p);'), 'se convierten al cargar');
  assert.ok(g.includes("return { ...resto, plano: 'cantero' };"));
  // un solo plano con la función 'huerta'
  const cons = leer('src/construccion.js');
  assert.equal(cons.split("funciones: ['huerta']").length - 1, 1, 'no hay dos canteros distintos');
  assert.ok(!cons.includes("id: 'huerta'"), 'el plano de la 2.0 salió');
}

// ======================================================== 6. la escarcha
{
  const E = await import('../src/escarcha.js');
  // la estación: el invierno hiela más que el otoño, y el verano casi nada
  assert.ok(E.fuerzaDeEstacion(1, 0) > E.fuerzaDeEstacion(0, 1));
  assert.ok(E.fuerzaDeEstacion(0, 1) > E.fuerzaDeEstacion(0, 0));
  assert.ok(E.fuerzaDeEstacion(0, 0) < 0.3, 'en verano apenas una helada fina');
  assert.ok(E.fuerzaDeEstacion(1, 1) <= 1);
  // el día: se forma de madrugada, está al amanecer, se va con el sol
  assert.equal(E.formaDelDia(14, 0), 0, 'a la tarde no hay');
  assert.equal(E.formaDelDia(6.5, 0), 1, 'al amanecer está entera');
  assert.ok(E.formaDelDia(3, 0) > 0 && E.formaDelDia(3, 0) < 1, 'se va formando de madrugada');
  assert.ok(E.formaDelDia(9.5, 1) > E.formaDelDia(9.5, 0), 'en invierno dura más a la mañana');
  assert.equal(E.formaDelDia(11, 1), 0, 'a media mañana ya se derritió, aun en invierno');
  const base = { horas: 6.5, invierno: 1, otono: 0, nublado: 0, lluvia: 0, viento: 0 };
  assert.ok(E.escarchaDe(base) > 0.95, 'mañana de invierno limpia y calma: todo blanco');
  assert.equal(E.escarchaDe({ ...base, lluvia: 0.5 }), 0, 'con lluvia no hay');
  assert.ok(E.escarchaDe({ ...base, nublado: 1 }) < 0.2, 'las nubes hacen de manta');
  assert.ok(E.escarchaDe({ ...base, viento: 1 }) < E.escarchaDe(base) * 0.4, 'el viento no la deja asentarse');
  assert.ok(E.escarchaDe({ ...base, invierno: 0 }) < E.CRUJE_DESDE, 'en verano no llega a crujir');
  assert.ok(E.escarchaDe({ ...base, invierno: 0, otono: 1 }) > E.CRUJE_DESDE, 'en otoño sí');
  // se oye: la escarcha es más ruidosa que el pasto de siempre (los animales también la oyen)
  const js = { velocidadActual: 3, superficie: 'pasto' };
  const pasto = firmaSonoraJugador(js); js.superficie = 'escarcha';
  assert.ok(firmaSonoraJugador(js) > pasto * 1.4, 'el pasto helado delata al que camina');
  // cableado: suelo, pasto, pisada, sonido y diario
  const main = leer('src/main.js');
  assert.match(leer('src/materiales.js'), /uEscarcha/, 'el suelo se escarcha');
  assert.match(leer('src/pasto.js'), /uEscarcha/, 'y las puntas del pasto');
  assert.match(leer('src/jugador.js'), /'escarcha'/, 'se pisa escarcha');
  assert.match(leer('src/sonido.js'), /case 'escarcha'/, 'y suena a escarcha');
  assert.match(main, /escarchaDe\(/, 'el juego la calcula');
  assert.match(main, /1 - Math\.exp\(-dh \/ 0\.25\)/, 'y se acomoda en horas del juego, no del reloj');
  assert.match(main, /diario\.escarcha\?\.\(/, 'y el diario la anota');
  const { crearDiario } = await import('../src/diario.js');
  const d = crearDiario(); d.escarcha(0.8); d.escarcha(0.1);
  assert.match(d.cerrar(3, 'otono', () => 0).texto, /escarcha/, 'la página del día recuerda la helada');
  const d2 = crearDiario(); d2.escarcha(0.2);
  assert.ok(!/escarcha|Helada/.test(d2.cerrar(3, 'otono', () => 0).texto), 'una helada que no se notó no se anota');
}

// ======================================================== 7 y 8. el techo y las paredes
{
  const L = await import('../src/techo-lluvia.js');
  const { MATERIALES, modos } = await import('../src/impactos.js');
  // cada techo golpea con un material que existe en el motor de golpes
  for (const [n, T] of Object.entries(L.TECHOS)) assert.ok(MATERIALES[T.material], `el techo ${n} usa un material que existe`);
  // la chapa suena más aguda que la lona, y la lona que las tablas
  const tono = (n) => { const T = L.TECHOS[n]; return modos(T.material, { tamaño: (T.tamaño[0] + T.tamaño[1]) / 2, dureza: (T.dureza[0] + T.dureza[1]) / 2 })[0].frec; };
  assert.ok(tono('chapa') > tono('lona') * 2, 'la chapa repiquetea agudo');
  assert.ok(tono('lona') > tono('tablas'), 'la lona es un parche; las tablas, lo más sordo');
  assert.ok(L.TECHOS.chapa.cama.frec > L.TECHOS.lona.cama.frec && L.TECHOS.lona.cama.frec > L.TECHOS.tablas.cama.frec, 'y la cama de abajo sigue el mismo orden');
  // la chapa no zumba como una campana: está clavada
  assert.ok(MATERIALES.chapa.modos[0][1] < MATERIALES.metal.modos[0][1] / 4);
  // las gotas: ninguna sin lluvia, más con más lluvia, y nunca más que el tope
  const fijo = () => 0.5;
  assert.equal(L.gotasEnCuadro('chapa', 0, 1 / 60, fijo), 0);
  assert.equal(L.gotasEnCuadro(null, 1, 1 / 60, fijo), 0, 'sin techo no hay golpes');
  let poca = 0, mucha = 0;
  for (let i = 0; i < 600; i++) { poca += L.gotasEnCuadro('chapa', 0.25, 1 / 60); mucha += L.gotasEnCuadro('chapa', 1, 1 / 60); }
  assert.ok(mucha > poca * 3, `la lluvia fuerte es un redoble (${poca} contra ${mucha} gotas en diez segundos)`);
  assert.ok(Math.abs(mucha / 10 - L.TECHOS.chapa.porSegundo) < L.TECHOS.chapa.porSegundo * 0.25, 'y cae lo que dice la receta');
  assert.ok(L.gotasEnCuadro('chapa', 1, 5, fijo) <= L.GOTAS_POR_CUADRO, 'un cuadro largo no dispara una avalancha');
  // ninguna gota es igual a otra
  const g1 = L.gota('chapa', () => 0.1), g2 = L.gota('chapa', () => 0.9);
  assert.ok(g1.tamaño !== g2.tamaño && g1.fuerza < g2.fuerza);
  assert.equal(L.gota('ninguno'), null);
  // la nieve no suena sobre el techo
  assert.equal(L.lluviaQueSuena(1, 1), 0);
  assert.equal(L.lluviaQueSuena(1, 0), 1);
  assert.equal(L.camaDeTecho(null, 1).vol, 0);
  // los techos del mapa y de lo que construís
  assert.equal(L.TECHO_DE_LUGAR.refugio, 'chapa');
  assert.equal(L.techoDeObra('piso-modular', 'techo-una-agua'), 'chapa');
  assert.equal(L.techoDeObra('piso-modular', 'techo-modular'), 'tablas');
  assert.equal(L.techoDeObra('casilla', null), 'tablas');
  // los espacios: cuanto más cerrado, menos viento y menos agudos de afuera
  const orden = ['bosque', 'alero', 'carpa', 'adentro'];
  for (let i = 1; i < orden.length; i++) {
    const a = L.ESPACIOS[orden[i - 1]], b = L.ESPACIOS[orden[i]];
    assert.ok(b.viento <= a.viento && b.filtro <= a.filtro, `${orden[i]} cierra más que ${orden[i - 1]}`);
  }
  assert.ok(L.ESPACIOS.adentro.lluvia < 0.3, 'entre paredes la lluvia de afuera casi no llega');
  assert.equal(L.espacioDe('cualquiera'), L.ESPACIOS.bosque);
  // la estructura trabaja con las rachas, no con la brisa, y afuera no hay estructura
  assert.equal(L.crujidosPorSegundo('adentro', 0.2), 0);
  assert.ok(L.crujidosPorSegundo('carpa', 1) > L.crujidosPorSegundo('adentro', 1), 'la lona flamea más de lo que cruje una casa');
  assert.equal(L.crujidosPorSegundo('bosque', 1.5), 0);
  // cableado
  const son = leer('src/sonido.js'), main = leer('src/main.js');
  assert.match(son, /gotaEnTecho\(e\.techo/, 'el motor hace sonar el techo');
  assert.match(son, /this\.bus\.techo\.connect\(this\.agaches\.techo\)/, 'y el techo no pasa por el filtro de las paredes');
  assert.match(son, /this\.agaches\.techo\.connect\(this\.master\)/, 'va derecho a la salida');
  assert.match(son, /E\.viento/, 'las paredes cortan el viento');
  assert.match(son, /case 'madera':[\s\S]{0,400}this\.impacto\('tabla'/, 'el piso de tablas es un golpe de verdad');
  assert.match(main, /ctxSonido\.techo = techoAudioActual/, 'el juego dice qué techo tenés encima');
  assert.match(main, /'lona'/, 'y la carpa es de lona');
}

// ======================================================== 9. el cielo cambia
{
  const C = await import('../src/cielo-noche.js');
  // un ciclo entero en ocho días, y el día 1 arranca con luna
  assert.ok(Math.abs(C.faseLunar(1, 0) - 0.25) < 1e-9, 'el día 1 es cuarto creciente');
  assert.ok(Math.abs(C.faseLunar(1 + C.DIAS_LUNA, 0) - C.faseLunar(1, 0)) < 1e-9, 'y se repite a los ocho días');
  assert.equal(C.nombreFase(C.faseLunar(3, 0.5)), 'luna llena');
  assert.equal(C.nombreFase(C.faseLunar(7, 0.5)), 'luna nueva');
  assert.ok(C.iluminada(0.5) > 0.999 && C.iluminada(0) < 1e-9 && Math.abs(C.iluminada(0.25) - 0.5) < 1e-9);
  // las ocho fases salen en orden y todas tienen nombre
  const nombres = new Set(); for (let f = 0; f < 1; f += 1 / 64) nombres.add(C.nombreFase(f));
  assert.equal(nombres.size, 8);
  // en el sur la luna no miente: creciendo, la luz está a la izquierda (la C)
  assert.equal(C.discoIluminado(0.25, -0.5, 0), 1, 'cuarto creciente: la mitad izquierda iluminada');
  assert.equal(C.discoIluminado(0.25, 0.5, 0), 0);
  assert.equal(C.discoIluminado(0.75, 0.5, 0), 1, 'cuarto menguante: la derecha (la D)');
  assert.equal(C.discoIluminado(0.75, -0.5, 0), 0);
  assert.equal(C.discoIluminado(0.5, 0.9, 0) + C.discoIluminado(0.5, -0.9, 0), 2, 'llena: todo');
  assert.equal(C.discoIluminado(0.001, 0.9, 0) + C.discoIluminado(0.001, -0.9, 0), 0, 'nueva: nada');
  assert.equal(C.discoIluminado(0.1, -0.95, 0), 1, 'la creciente fina es una uñita a la izquierda');
  assert.equal(C.discoIluminado(0.1, -0.3, 0), 0);
  // la luna y la noche
  const llena = C.luzDeLuna(0.5), nueva = C.luzDeLuna(0);
  assert.ok(llena.luz > nueva.luz * 3, 'con luna llena la noche se ve');
  assert.ok(nueva.estrellas > llena.estrellas && nueva.via > llena.via, 'sin luna, más estrellas y la Vía Láctea');
  // la lluvia de estrellas: sólo en verano, una noche cada seis
  assert.ok(C.nocheDeEstrellas(3, 1) && C.nocheDeEstrellas(9, 1));
  assert.ok(!C.nocheDeEstrellas(4, 1) && !C.nocheDeEstrellas(3, 0.2), 'no en invierno');
  const base = { horas: 1, noche: 1, nublado: 0, luna: 0 };
  assert.ok(C.fugacesPorMinuto({ ...base, lluvia: true }) > C.fugacesPorMinuto(base) * 10, 'la noche de la lluvia se nota');
  assert.ok(C.fugacesPorMinuto({ ...base, lluvia: true }) > C.fugacesPorMinuto({ ...base, lluvia: true, horas: 20.8 }), 'mejor de madrugada');
  assert.ok(C.fugacesPorMinuto({ ...base, lluvia: true, nublado: 1 }) < 0.6, 'con nubes, casi nada');
  assert.equal(C.fugacesPorMinuto({ ...base, noche: 0.3 }), 0, 'de día no');
  // las de la lluvia salen del radiante, bajo en el norte, y se alejan de él
  for (let i = 0; i < 200; i++) {
    const f = C.fugaz(true);
    assert.ok(Math.abs(f.acimut - C.RADIANTE.acimut) <= 62, 'salen del lado norte');
    assert.ok(f.altura >= 14 && f.altura <= 80);
    const avance = [Math.cos(f.rumbo), Math.sin(f.rumbo)], desde = [f.acimut - C.RADIANTE.acimut, f.altura - C.RADIANTE.altura];
    assert.ok(avance[0] * desde[0] + avance[1] * desde[1] > -1e-9, 'y corren alejándose del radiante');
    assert.ok(f.dur > 0.3 && f.dur < 0.9 && f.largo > 5);
  }
  assert.equal(C.FUGACES_PARA_ANOTAR, 3);
  assert.ok(C.lunaAnotable(0.5) && !C.lunaAnotable(0.3));
  // el cuaderno, el diario y el dibujo
  const cua = leer('src/cuaderno.js'), cie = leer('src/cielo.js'), main = leer('src/main.js');
  assert.match(cua, /id: 'luna-llena', seccion: 'cielo'/);
  assert.match(cua, /id: 'geminidas', seccion: 'cielo'/);
  assert.match(cie, /uFaseLuna < 0\.5 \? -enDisco\.x : enDisco\.x/, 'el disco usa la misma regla de la C');
  assert.match(cie, /\* luzLuna;/, 'la luna nueva oscurece la noche');
  assert.match(main, /registrar\('geminidas'\)/);
  assert.match(main, /registrar\('luna-llena'\)/);
  assert.match(main, /!bajoTecho && mirada\.dot\(dirFugaz\) > 0\.55/, 'una fugaz cuenta si la viste');
  const { crearDiario } = await import('../src/diario.js');
  const d = crearDiario(); for (let i = 0; i < 4; i++) d.anotar('fugaz');
  assert.match(d.cerrar(9, 'verano', () => 0).texto, /Llovieron estrellas\. Conté 4/);
}

// ======================================================== 10. el cuaderno como lámina
{
  const L = await import('../src/lamina.js');
  const { ENTRADAS } = await import('../src/cuaderno.js');
  const dib = leer('src/lamina-dibujo.js');
  // cada anotación dibujable tiene un boceto que existe
  const tipos = [...dib.matchAll(/^  (\w+)\(x, r(?:, e)?\) \{/gm)].map((m) => m[1]);
  for (const e of ENTRADAS.filter((x) => L.SECCIONES_LAMINA.includes(x.seccion))) {
    assert.ok(tipos.includes(L.tipoDeBoceto(e)), `${e.id} tiene boceto (${L.tipoDeBoceto(e)})`);
  }
  assert.equal(L.tipoDeBoceto({ id: 'condor', seccion: 'fauna' }), 'ave');
  assert.equal(L.tipoDeBoceto({ id: 'huemul', seccion: 'fauna' }), 'mamifero');
  assert.equal(L.tipoDeBoceto({ id: 'perca', seccion: 'peces' }), 'pez');
  assert.equal(L.tipoDeBoceto({ id: 'luna-llena', seccion: 'cielo' }), 'luna');
  // se reparte entre secciones: una partida de puro pescar no da puras truchas
  const muchas = {};
  ENTRADAS.filter((e) => e.seccion === 'peces').forEach((e, i) => { muchas[e.id] = { dia: 10 + i }; });
  ENTRADAS.filter((e) => e.seccion === 'flora').slice(0, 2).forEach((e) => { muchas[e.id] = { dia: 1 }; });
  const sel = L.elegirEspecimenes({ entradas: muchas }, ENTRADAS, 4);
  assert.equal(sel.length, 4);
  assert.ok(sel.filter((e) => e.seccion === 'flora').length === 2, 'las dos plantas entran aunque sean viejas');
  // lo que no se dibuja no entra, y nada que no esté anotado
  const sel2 = L.elegirEspecimenes({ entradas: { mate: { dia: 1 }, coihue: { dia: 2 } } }, ENTRADAS);
  assert.deepEqual(sel2.map((e) => e.id), ['coihue']);
  assert.ok(L.elegirEspecimenes({ entradas: Object.fromEntries(ENTRADAS.map((e) => [e.id, { dia: 1 }])) }, ENTRADAS).length === L.CUPO_ESPECIMENES);
  // las fotos: sólo las que tienen imagen, las más nuevas primero
  const D = [{ id: 'a', nombre: 'A' }, { id: 'b', nombre: 'B' }, { id: 'c', nombre: 'C' }];
  const fotos = L.elegirFotos({ desafios: { a: { dia: 1, img: 'x' }, b: { dia: 5, img: 'y' }, c: { dia: 9 } } }, D);
  assert.deepEqual(fotos.map((f) => f.id), ['b', 'a']);
  // la hoja entera, con una partida vacía también
  const vacia = L.datosLamina({}, { ENTRADAS, DESAFIOS: D });
  assert.equal(vacia.especimenes.length, 0); assert.equal(vacia.fotos.length, 0); assert.equal(vacia.pagina, null);
  const llena = L.datosLamina({ dia: 12, entradas: { coihue: { dia: 2 } }, diario: [{ dia: 11, texto: 'Llovió.' }] }, { ENTRADAS, DESAFIOS: D, estacion: 'otoño', luna: 'luna llena' });
  assert.match(llena.subtitulo, /día 12 · otoño · luna llena/);
  assert.deepEqual(llena.pagina, { dia: 11, texto: 'Llovió.' });
  // los renglones: cortan por palabra y terminan en puntos suspensivos si no entran
  const medir = (t) => t.length * 10;
  assert.deepEqual(L.renglones('uno dos tres cuatro', 80, medir), ['uno dos', 'tres', 'cuatro']);
  const cortado = L.renglones('uno dos tres cuatro cinco seis', 80, medir, 2);
  assert.equal(cortado.length, 2); assert.match(cortado[1], /…$/);
  assert.ok(cortado.every((l) => medir(l) <= 80));
  assert.equal(L.nombreArchivoLamina(7.8), 'hojarasca-lamina-dia-7.png');
  // cableado
  const main = leer('src/main.js');
  assert.match(main, /'Guardar como lámina'/);
  assert.match(main, /dibujarLamina\(document\.createElement\('canvas'\), datos, cargarImagen\)/);
  assert.ok(!/^export async/m.test(dib), 'el empaquetador no entiende export async');
}

// ======================================================== cableado
{
  const main = leer('src/main.js'), fauna = leer('src/fauna.js'), vida = leer('src/vida.js'), guia = leer('src/guia.js');
  assert.match(main, /avanzarCalma\(jugador\.estado, dtReal\)/, 'la paciencia se mide en tiempo de reloj');
  assert.match(fauna, /puntoDeCuriosidad\(p\.pos, js\.pos, calmaDe\(js\), CURIOSIDAD\.pudu, r\)/, 'el pudú usa la curiosidad');
  assert.match(vida, /CURIOSIDAD\[prm\.especie\]/, 'y el huemul también');
  assert.match(main, /afinarOido\(oidoAfinado, !!js\.agachado/, 'se escucha agachado');
  assert.match(fauna, /escuchando/, 'la fauna sabe cuándo estás escuchando');
  assert.ok(/\['Esperar',/.test(guia) && /\['Escuchar',/.test(guia), 'la guía explica esperar y escuchar');
  // no se pisa una tecla que ya hace otra cosa: V suelta lo que tenés en la mano
  assert.ok(!/escuchar: 'KeyV'/.test(leer('src/accesibilidad.js')), 'escuchar no puede robarle la V a soltar');
}

console.log('relax 2.0: ok · las diez mejoras (paciencia, oído, perro, encargos, huerta, escarcha, techo, paredes, cielo, lámina)');
