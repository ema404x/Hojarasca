// 2.3: las diez ideas nuevas, en Node. Primero la lógica pura de cada una; al final,
// que el juego las tenga enganchadas (se lee el código como texto).
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as C from '../src/colmena.js';
import * as A from '../src/ahumadero.js';
import * as V from '../src/vivero.js';
import * as L from '../src/lena.js';
import * as K from '../src/cuentos.js';
import * as S from '../src/semilla.js';
import * as I from '../src/desafio-infestacion.js';
import * as R from '../src/desafio-varada.js';
import * as Q from '../src/desafio-cielo.js';
import * as Z from '../src/desafio-zanja.js';

const leer = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const casi = (a, b, e = 1e-6) => assert.ok(Math.abs(a - b) < e, `${a} ≈ ${b}`);

// ---------------------------------------------------------------- 1. la colmena
{
  const c = C.colmenaNueva();
  assert.equal(C.avanzarColmena(c, 10, { noche: 1 }), 0, 'de noche no trabajan');
  assert.equal(c.horas, 0);
  assert.equal(C.avanzarColmena(c, 100, { invierno: 1 }), 0, 'en invierno tampoco');
  assert.equal(C.avanzarColmena(c, C.COLMENA.horasMiel, {}), 1, 'con sol, un frasco cada tanto');
  C.avanzarColmena(c, 1000, {});
  assert.equal(c.miel, C.COLMENA.tope, 'junta hasta el tope y ahí para');
  assert.equal(c.horas, 0);
  const lento = C.colmenaNueva(); C.avanzarColmena(lento, 20, { lluvia: 0.8 });
  const rapido = C.colmenaNueva(); C.avanzarColmena(rapido, 20, { canteros: 2 });
  assert.ok(lento.horas < 20 && rapido.horas > 20, 'la lluvia las frena y la huerta las apura');
  assert.deepEqual(C.usarColmena(c), { accion: 'cosechar', miel: 3 });
  assert.equal(C.usarColmena(c).accion, 'esperar');
  assert.equal(C.usarColmena(c, { invierno: 1 }).accion, 'invierno');
  const k = { x: 0, z: 0 };
  assert.equal(C.cosechaConAbejas(5, k, [{ x: 10, z: 5 }]), 6, 'un cantero al alcance rinde uno más');
  assert.equal(C.cosechaConAbejas(5, k, [{ x: 40, z: 0 }]), 5);
  assert.ok(C.seAlborotan(2, true, 60) && !C.seAlborotan(2, false, 60) && !C.seAlborotan(2, true, 5));
  assert.deepEqual(C.sanearColmena({ miel: 99, horas: -3 }), { miel: 3, horas: 0 });
  assert.deepEqual(C.sanearColmena('x'), { miel: 0, horas: 0 });
}

// ---------------------------------------------------------------- 2. el ahumadero
{
  assert.ok(A.teLaQuedas('arcoiris', true, 0) && A.teLaQuedas('fontinalis', true, 1));
  assert.ok(!A.teLaQuedas('arcoiris', true, 2), 'dos por día');
  assert.ok(!A.teLaQuedas('arcoiris', false, 0), 'sin ahumadero, vuelven todas');
  assert.ok(!A.teLaQuedas('perca', true, 0) && !A.teLaQuedas('pejerrey', true, 0), 'las nativas vuelven siempre');
  const a = A.ahumaderoVacio();
  assert.equal(A.usarAhumadero(a, 0, 5).accion, 'sinTruchas');
  assert.equal(A.usarAhumadero(a, 3, 0).accion, 'sinLena');
  assert.deepEqual(A.usarAhumadero(a, 6, 2), { accion: 'colgar', truchas: 4, lena: 1 }, 'entran cuatro');
  assert.equal(A.usarAhumadero(a, 2, 2).accion, 'ahumando');
  assert.ok(!A.avanzarAhumado(a, 6) && A.avanzarAhumado(a, 6), 'medio día de humo');
  assert.equal(A.avisoAhumadero(a, 0, 0), 'Sacar las truchas ahumadas (4)');
  assert.deepEqual(A.usarAhumadero(a, 0, 0), { accion: 'sacar', ahumadas: 4 });
  assert.deepEqual(A.sanearAhumadero({ truchas: 9, horas: 50, listas: 3 }), { truchas: 4, horas: 12, listas: 0 });
}

// ---------------------------------------------------------------- 3. el vivero
{
  const j = V.sanearJuntadas(null, 5);
  const arbol = { i: 12, especie: 'coihue', esc: 1 };
  assert.equal(V.puedeJuntarSemilla(arbol, { otono: 0, juntadas: j }).motivo, 'fueraDeEstacion');
  assert.deepEqual(V.puedeJuntarSemilla(arbol, { otono: 1, juntadas: j }), { ok: true, semilla: 'semilla-coihue' });
  j.arboles.push(12);
  assert.equal(V.puedeJuntarSemilla(arbol, { otono: 1, juntadas: j }).motivo, 'yaJuntada', 'una por árbol y por día');
  assert.equal(V.puedeJuntarSemilla({ i: 3, especie: 'arrayan', esc: 1 }, { otono: 1, juntadas: j }).ok, false);
  assert.equal(V.sanearJuntadas(j, 6).arboles.length, 0, 'al otro día se puede de nuevo');
  const v = V.viveroVacio();
  const ent = { 'semilla-coihue': { cantidad: 4 }, pinon: { cantidad: 5 } };
  const s = V.usarVivero(v, ent, 10);
  assert.equal(s.accion, 'sembrar'); assert.equal(s.total, 6, 'seis almácigos');
  assert.deepEqual(s.sembradas, { coihue: 4, pehuen: 2 });
  assert.equal(V.usarVivero(v, ent, 11).accion, 'creciendo');
  const sacar = V.usarVivero(v, ent, 10 + V.VIVERO.diasPlantin);
  assert.deepEqual(sacar.plantines, { coihue: 4, pehuen: 2 });
  assert.equal(v.macetas.length, 0);
  assert.equal(V.plantinDisponible({ 'plantin-lenga': { cantidad: 1 } }).especie, 'lenga');
  assert.equal(V.plantinDisponible({}), null);
  assert.equal(V.sanearVivero({ macetas: [{ especie: 'x', dia: 1 }, { especie: 'nire', dia: '3' }] }).macetas.length, 1);
}

// ---------------------------------------------------------------- 4. la leña del invierno
{
  assert.deepEqual(L.lenaParaPrender({ invierno: 0 }), { ok: true, de: null }, 'en verano, como siempre');
  assert.deepEqual(L.lenaParaPrender({ invierno: 1, lenera: { secos: 2 } }), { ok: true, de: 'lenera' });
  assert.deepEqual(L.lenaParaPrender({ invierno: 1, troncos: 3, humedad: 0.2 }), { ok: true, de: 'mochila' });
  assert.equal(L.lenaParaPrender({ invierno: 1, troncos: 3, humedad: 0.8 }).motivo, 'mojada');
  assert.equal(L.lenaParaPrender({ invierno: 1 }).motivo, 'sinLena');
  let h = L.humedecer(0, 1, { lluvia: 1 });
  assert.ok(h > L.LENA.mojada, 'una hora de lluvia la moja');
  assert.equal(L.humedecer(0.4, 2, { lluvia: 1, bajoTecho: true }), 0.4 - 0.16, 'bajo techo no se moja');
  h = L.humedecer(1, 12, {}); assert.ok(h < 0.1, 'en medio día seco se seca');
  const l = L.leneraVacia();
  assert.equal(L.guardarEnLenera(l, 20), 16); assert.equal(L.guardarEnLenera(l, 5), 0);
  assert.equal(L.comoDormiste({ invierno: 0 }), 'normal');
  assert.equal(L.comoDormiste({ invierno: 1, distanciaAlFuego: 3 }), 'calentito');
  assert.equal(L.comoDormiste({ invierno: 1, manta: true }), 'fresco');
  assert.equal(L.comoDormiste({ invierno: 1 }), 'frio');
  assert.ok(L.horasEntumecido('frio') > L.horasEntumecido('fresco') && L.horasEntumecido('calentito') === 0);
  assert.equal(L.desentumecer(2.5, 1, true), 0, 'junto al fuego se pasa rápido');
  casi(L.desentumecer(2.5, 1, false), 1.5);
}

// ---------------------------------------------------------------- 5. el fogón de cuentos
{
  assert.equal(new Set(K.CUENTOS.map((c) => c.quien)).size, 4, 'un cuento por cada visitante');
  for (const c of K.CUENTOS) assert.ok(c.partes.length >= 3 && c.id.startsWith('c-'));
  assert.ok(K.seQuedaAlFuego(true, 21) && !K.seQuedaAlFuego(false, 21) && !K.seQuedaAlFuego(true, 23.5));
  assert.equal(K.cuentoPara('ramon', {}).id, 'c-luz-mala');
  assert.equal(K.cuentoPara('ramon', { 'c-luz-mala': {} }), null);
  assert.ok(K.esHoraDeCuentos(21) && !K.esHoraDeCuentos(18));
  const siempre = () => 0;
  assert.ok(!K.nocheDeLomo({ dia: 10, luna: 1, escucho: false, azar: siempre }), 'hace falta haber oído del lago');
  assert.ok(K.nocheDeLomo({ dia: 10, luna: 1, escucho: true, azar: siempre }));
  assert.ok(!K.nocheDeLomo({ dia: 10, ultimo: 9, luna: 1, escucho: true, azar: siempre }), 'no dos noches seguidas');
  assert.ok(!K.nocheDeLomo({ dia: 10, luna: 0.2, escucho: true, azar: siempre }), 'sin luna no se ve');
  assert.equal(K.alturaLomo(-1), 0); casi(K.alturaLomo(1.5), 0.5); assert.equal(K.alturaLomo(5), 1); assert.equal(K.alturaLomo(99), 0);
  const p = K.dondeAsoma({ x: 0, z: 0 }, 0, (x, z) => z < -60, () => 0.5);
  assert.ok(p && p.z < -60, 'asoma adelante, sobre el agua');
  assert.equal(K.dondeAsoma({ x: 0, z: 0 }, 0, () => false), null);
}

// ---------------------------------------------------------------- 6. la infestación
{
  assert.equal(I.cuantosCapullos(3), 0);
  assert.equal(I.cuantosCapullos(4), 2);
  assert.equal(I.cuantosCapullos(12), 4);
  assert.equal(I.cuantosCapullos(99), I.CAPULLOS.max);
  const azar = S.azarDe('COIHUE-4821', 6, 'capullos');
  const l = I.lugaresCapullos(5, { x: 0, z: 0 }, { azar });
  assert.equal(l.length, 5);
  for (const c of l) {
    const d = Math.hypot(c.x, c.z);
    assert.ok(d >= 44 && d <= 171, `a la distancia justa (${d})`);
    assert.ok(l.every((o) => o === c || Math.hypot(o.x - c.x, o.z - c.z) >= I.CAPULLOS.separacion));
  }
  assert.deepEqual(I.lugaresCapullos(5, { x: 0, z: 0 }, { azar: S.azarDe('COIHUE-4821', 6, 'capullos') }), l, 'con el mismo código, en el mismo lugar');
  assert.equal(I.queSale(5).length, 1); assert.equal(I.queSale(12).length, 2);
  assert.equal(I.usarCapullo({ ramitas: 1 }).accion, 'quemar');
  assert.equal(I.usarCapullo({ ramitas: 0 }).accion, 'sinRamitas');
  assert.equal(I.usarCapullo({ ramitas: 3, lluvia: 0.9 }).accion, 'mojado');
  const c = { x: 0, z: 0, golpes: 0 };
  assert.ok(!I.golpearCapullo(c) && !I.golpearCapullo(c) && I.golpearCapullo(c), 'tres golpes');
  assert.equal(I.sanearCapullos([{ x: 1, z: 2, golpes: 9 }, { x: 'a' }]).length, 1);
}

// ---------------------------------------------------------------- 7. la trochita varada
{
  const nunca = () => 0.99, siempre = () => 0;
  assert.ok(!R.nocheDeVarada(4, { azar: siempre }));
  assert.ok(R.nocheDeVarada(6, { azar: siempre }));
  assert.ok(!R.nocheDeVarada(6, { azar: siempre, rescate: 'puesto' }), 'una cosa por noche');
  assert.ok(!R.nocheDeVarada(10, { azar: siempre, esJefe: true }) && !R.nocheDeVarada(6, { azar: nunca }));
  const { s, falta } = R.puntoDeVarada(2000, 100, () => 0);
  assert.equal(falta, R.VARADA.distancia[0]); assert.equal(s, 2000 - (R.VARADA.distancia[0] - 100), 'da la vuelta al anillo');
  const v = R.varadaNueva(s, falta);
  assert.equal(R.avanzarVarada(v, 1, 40, 2000), 0, 'lejos tuyo, Elsa frena');
  casi(R.avanzarVarada(v, 1, 5, 2000), R.VARADA.vel);
  for (let i = 0; i < 400 && !v.llego; i++) R.avanzarVarada(v, 1, 5, 2000);
  assert.ok(v.llego); casi(v.s, 100, 1e-3);
  assert.equal(R.quedaParaLlegar(v), 0);
  assert.ok(R.premioVarada(10).cristal > R.premioVarada(1).cristal);
  assert.equal(R.sanearVarada(null), null);
  assert.equal(R.sanearVarada({ s: 5, falta: 300, recorrido: 900, vida: -5 }).recorrido, 300);
}

// ---------------------------------------------------------------- 8. el volador
{
  assert.equal(Q.voladoresEnLaNoche(7, 20), 0);
  assert.equal(Q.voladoresEnLaNoche(8, 12), 2);
  assert.equal(Q.voladoresEnLaNoche(20, 60), 3);
  const b = Q.blancoVolador({ x: 0, z: 0 }, [{ x: 30, z: 0 }, { x: 10, z: 0 }], { x: 5, z: 5 });
  assert.equal(b.tipo, 'antorcha'); assert.equal(b.x, 10, 'la antorcha más cercana');
  assert.equal(Q.blancoVolador({ x: 0, z: 0 }, [{ x: 300, z: 0 }], { x: 5, z: 5 }).tipo, 'jugador', 'si no ve antorchas, va por vos');
  assert.equal(Q.alturaDeseada(30, 0), Q.VUELO.alto);
  assert.equal(Q.alturaDeseada(0, 0), Q.VUELO.bajo, 'en la picada baja hasta la llama');
  assert.equal(Q.alturaDeseada(0, 1), Q.VUELO.alto, 'después de pegar, sube');
  assert.ok(Q.alAlcanceDeLaMano(2) && !Q.alAlcanceDeLaMano(7));
  const cand = [{ d: 10, alto: 7, vuela: true }, { d: 5, alto: 0, vuela: false }];
  assert.equal(Q.elegirParaTorreta({ alcance: 26 }, cand).d, 5, 'la ballesta común no le apunta al que va alto');
  assert.equal(Q.elegirParaTorreta(Q.BALLESTA_CIELO, cand).d, 10, 'la del cielo prefiere al volador');
  assert.equal(Q.elegirParaTorreta(Q.BALLESTA_CIELO, [{ d: 5, alto: 0, vuela: false }]).d, 5, 'y si no hay, tira a los de tierra');
  // en la oleada: desde la noche 8, sin cambiar cuántos vienen
  const { composicionOleada, TIPOS_ALIEN } = await import('../src/desafio-reglas.js');
  assert.ok(TIPOS_ALIEN.volador?.vuela, 'el volador es un tipo de invasor');
  assert.ok(!composicionOleada(7).includes('volador') && composicionOleada(8).includes('volador'));
  for (let n = 1; n <= 20; n++) assert.ok(composicionOleada(n).length <= 18, `la noche ${n} no pasa de 18`);
}

// ---------------------------------------------------------------- 9. la zanja de fuego
{
  const z = Z.zanjaVacia();
  assert.equal(Z.usarZanja(z, { troncos: 0 }).accion, 'sinLena');
  assert.deepEqual(Z.usarZanja(z, { troncos: 1 }), { accion: 'cargar', troncos: 1, lista: false });
  assert.deepEqual(Z.usarZanja(z, { troncos: 5 }), { accion: 'cargar', troncos: 1, lista: true });
  assert.equal(Z.usarZanja(z, { lluvia: 0.9 }).accion, 'mojada', 'con lluvia no prende');
  assert.equal(z.lena, Z.ZANJA.lena, 'y la leña sigue ahí');
  assert.equal(Z.usarZanja(z, {}).accion, 'prender');
  assert.equal(z.ardiendo, Z.ZANJA.dura);
  assert.equal(Z.usarZanja(z, {}).accion, 'ardiendo');
  assert.ok(!Z.consumir(z, 30) && Z.consumir(z, 30), 'arde un minuto');
  casi(Z.distanciaALaZanja({ x: 0, z: 1 }, 0, 0, 0), 1);
  casi(Z.distanciaALaZanja({ x: 3, z: 0 }, 0, 0, 0), 3 - Z.ZANJA.largo / 2);
  casi(Z.distanciaALaZanja({ x: 0, z: 1 }, 0, 0, Math.PI / 2), 0, 1e-9);
  assert.ok(Z.enElFuego({ x: 0.5, z: 0.4 }, { x: 0, z: 0, rot: 0, largo: 3.2 }));
  assert.ok(!Z.seEscapa(0.3, 0, () => 0), 'sin viento no se escapa');
  assert.ok(!Z.seEscapa(0.9, 0.5, () => 0), 'con lluvia tampoco');
  assert.ok(Z.seEscapa(0.9, 0, () => 0));
  const salto = Z.saltoDelFuego({ x: 0, z: 0 }, () => 0.5);
  assert.ok(salto.x > 2 && Math.abs(salto.z) < 0.01, 'a favor del viento (+x)');
  assert.equal(Z.radioFoco(-1), 0); assert.equal(Z.radioFoco(8), Z.ESCAPE.radioMax); assert.equal(Z.radioFoco(99), 0);
  assert.deepEqual(Z.sanearZanja({ lena: 7, ardiendo: 30 }), { lena: 2, ardiendo: 0 });
}

// ---------------------------------------------------------------- 10. la semilla
{
  assert.equal(S.normalizarCodigo(' coihue 4821 '), 'COIHUE-4821');
  assert.equal(S.normalizarCodigo('Ñire-12'), 'NIRE-12');
  assert.equal(S.normalizarCodigo('¡hola!'), null);
  assert.equal(S.hashTexto('abc'), S.hashTexto('abc'));
  assert.notEqual(S.hashTexto('abc'), S.hashTexto('abd'));
  const a = S.azarDe('COIHUE-4821', 5, 'especial'), b = S.azarDe('COIHUE-4821', 5, 'especial');
  const na = [a(), a(), a()], nb = [b(), b(), b()];
  assert.deepEqual(na, nb, 'mismo código, misma noche y mismo tema: mismo azar');
  assert.notDeepEqual(na, [S.azarDe('COIHUE-4821', 6, 'especial')()], 'otra noche, otro azar');
  assert.equal(S.azarDe(null, 5, 'x'), Math.random, 'sin código, como siempre');
  const lunes = S.codigoDeLaSemana(new Date(2026, 8, 21)), domingo = S.codigoDeLaSemana(new Date(2026, 8, 27));
  assert.equal(lunes, domingo, 'toda la semana el mismo código');
  assert.notEqual(lunes, S.codigoDeLaSemana(new Date(2026, 8, 28)), 'y el lunes siguiente, otro');
  assert.ok(S.normalizarCodigo(lunes) === lunes);
  assert.deepEqual(S.semanaIso(new Date(2026, 0, 1)), { anio: 2026, semana: 1 });
  const rec = {};
  assert.ok(S.registrarSemilla(rec, 'LENGA-1', { noches: 3, abatidos: 20 }).mejoro);
  assert.ok(!S.registrarSemilla(rec, 'LENGA-1', { noches: 2, abatidos: 90 }).mejoro);
  assert.equal(rec['LENGA-1'].noches, 3);
  assert.deepEqual(S.sanearRecordsSemilla({ 'lenga 1': { noches: '4' }, x: 3 }), { 'LENGA-1': { noches: 4, abatidos: 0, fecha: '' } });
}

// ---------------------------------------------------------------- arreglos del camino
{
  // la huerta de la 2.2 no tenía aspecto para los calafates: el cantero tiraba un error
  const malla = leer('src/huerta-malla.js');
  const { CULTIVOS } = await import('../src/huerta.js');
  for (const k of Object.keys(CULTIVOS)) assert.match(malla, new RegExp(`\\b${k}: \\{ hoja`), `el cultivo ${k} tiene cómo verse`);
  // el diario tenía casos repetidos ('rastro', 'cosecha') y el segundo nunca corría
  const diario = leer('src/diario.js');
  const casos = [...diario.matchAll(/case '([a-zA-Z]+)':/g)].map((m) => m[1]);
  assert.equal(casos.length, new Set(casos).size, `casos repetidos en el diario: ${casos.filter((c, i) => casos.indexOf(c) !== i)}`);
  // la marca del tendal ya no viaja en el guardado
  assert.doesNotMatch(leer('src/main.js'), /tendalSaneado = true/);
}

console.log('2.3: ok · las diez ideas (colmena, ahumadero, vivero, leña, fogón · infestación, trochita varada, volador, zanja de fuego, semilla)');
