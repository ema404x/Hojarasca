// 2.0: las diez mejoras del Desafío, en lo que tienen de lógica pura.
// Las partidas reales están en `pruebas/humo-desafio-2.cjs`.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as S from '../src/desafio-sentidos.js';
import * as N from '../src/desafio-noche2.js';
import { nocheEspecial, ESPECIALES, sanearDesafio, desafioNuevo } from '../src/desafio-reglas.js';
import { siguenLasNoches } from '../src/desafio-nido.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const des = leer('src/desafio.js'), alien = leer('src/desafio-alien.js'), main = leer('src/main.js');

// ======================================================== 1. los ojos reflejan la linterna
{
  const base = { encendida: true, cosLinterna: 1, angulo: 0.42, distancia: 30, alcance: 42, frente: 1, noche: 1 };
  assert.ok(S.reflejoOjos(base) > 0.5, 'en el haz, de frente, de noche: dos puntos que se prenden');
  assert.equal(S.reflejoOjos({ ...base, encendida: false }), 0, 'sin linterna, nada');
  assert.equal(S.reflejoOjos({ ...base, cosLinterna: Math.cos(0.9) }), 0, 'fuera del haz, nada');
  assert.equal(S.reflejoOjos({ ...base, frente: 0 }), 0, 'si te da la espalda, no te devuelve la luz');
  assert.equal(S.reflejoOjos({ ...base, noche: 0 }), 0, 'de día no se nota');
  assert.ok(S.reflejoOjos({ ...base, distancia: 60 }) > 0, 'se ve más lejos de lo que alumbra el haz');
  assert.equal(S.reflejoOjos({ ...base, distancia: 42 * S.ALCANCE_REFLEJO }), 0);
  assert.ok(S.reflejoOjos({ ...base, distancia: 3 }) < S.reflejoOjos(base), 'encima se pierde en la luz que le da en la cara');
  // en el shader: la almendra (emisión 0.015) y el punto húmedo, con su propio uniforme
  assert.match(alien, /uniform float uReflejo/);
  assert.match(alien, /abs\(vEmision - 0\.015\)/);
  assert.match(alien, /emision: 0\.015/, 'la almendra del ojo sigue marcada con 0.015');
  assert.match(alien, /invasor-esqueleto-v4/, 'la clave del programa cambió con el shader');
  assert.ok(!/`desafio-sentidos\.js`/.test(alien.slice(alien.indexOf('opaque_fragment'), alien.indexOf('customProgramCacheKey'))), 'sin comillas invertidas dentro del GLSL');
  assert.match(des, /reflejoOjos\(\{ encendida: true/);
  assert.match(main, /linterna: \(\) => \(\{ encendida:/);
}

// ======================================================== 2. el acecho
{
  const m = (o) => S.modoAcecho({ tipo: 'rastreador', distancia: 25, mirado: false, noche: 1, ...o });
  assert.equal(m({}), 'cargar', 'de espaldas, carga');
  assert.equal(m({ mirado: true }), 'rodear', 'mirándolo y sin árbol, rodea');
  assert.equal(m({ mirado: true, arbol: true }), 'esconderse');
  assert.equal(m({ distancia: 5 }), 'normal', 'encima ya no acecha: ataca');
  assert.equal(m({ distancia: 70 }), 'normal');
  assert.equal(m({ noche: 0.2 }), 'normal', 'de día no');
  assert.equal(m({ tipo: 'bruto' }), 'normal', 'el bruto no acecha');
  assert.equal(m({ herido: true }), 'normal', 'herido deja de jugar');
  assert.ok(S.VELOCIDAD_ACECHO.cargar > 1.3 && S.VELOCIDAD_ACECHO.rodear < 1);
  // rodear: de costado, y corrigiendo hacia el radio
  const lejos = S.rumboRodeo({ x: 0, z: 0 }, { x: 0, z: 40 }, 1), cerca = S.rumboRodeo({ x: 0, z: 0 }, { x: 0, z: 8 }, 1);
  assert.ok(Math.cos(lejos) > 0, 'lejos, se cierra un poco hacia vos');
  assert.ok(Math.cos(cerca) < 0, 'cerca, se abre');
  // el escondite queda del otro lado del árbol
  const e = S.escondite({ x: 10, z: 0, r: 0.5 }, { x: 0, z: 0 });
  assert.ok(e.x > 10.5, 'detrás del tronco, visto desde vos');
  assert.ok(S.estaMirando({ x: 0, z: -1 }, { x: 0, z: 0 }, { x: 0, z: -10 }));
  assert.ok(!S.estaMirando({ x: 0, z: -1 }, { x: 0, z: 0 }, { x: 0, z: 10 }));
  assert.match(des, /if \(modo === 'cargar' && a\.acecho !== 'cargar' && dist < 32\) S\.pasos\(p\)/, 'cuando carga, se lo oye venir');
}

// ======================================================== 3. el perro avisa
{
  assert.equal(S.avisoDelPerro({ distancia: 30, visto: false }), 'grunir');
  assert.equal(S.avisoDelPerro({ distancia: 30, visto: true }), null, 'lo que ya ves, no te lo marca');
  assert.equal(S.avisoDelPerro({ distancia: 10, visto: true }), 'ladrar', 'cerca ladra igual');
  assert.equal(S.avisoDelPerro({ distancia: 80, visto: false }), null);
  const ali = leer('src/desafio-aliados.js'), perro = leer('src/perro.js');
  assert.match(ali, /avisoDelPerro\(\{ distancia: d0, visto \}\)/);
  assert.match(perro, /est\.estado === 'alerta'/, 'el perro se queda duro mirando para ese lado');
  assert.match(main, /mundoPerro\.alerta = /);
}

// ======================================================== 4. el asedio
{
  assert.equal(N.tiempoDeTanteo('bruto'), 0, 'el bruto no tantea');
  const t = N.tiempoDeTanteo('rastreador', () => 0.5);
  assert.ok(t > 2 && t < 5);
  assert.equal(N.faseAsedio(0.5, 4, true), 'rascar');
  assert.equal(N.faseAsedio(3.5, 4, true), 'puerta', 'al final prueba la puerta');
  assert.equal(N.faseAsedio(3.5, 4, false), 'rascar', 'si no hay puerta, sigue rascando');
  assert.equal(N.faseAsedio(4.1, 4, true), 'golpear');
  assert.equal(N.faseAsedio(1, 0, true), 'golpear', 'sin tanteo, golpea');
  assert.ok(N.esAsedio(true, 3) && !N.esAsedio(false, 3) && !N.esAsedio(true, 20));
  assert.ok(N.tienePuerta({ id: 'pared-puerta' }) && N.tienePuerta({ id: 'casilla', habitable: true }) && !N.tienePuerta({ id: 'empalizada' }));
  assert.match(des, /esAsedio\(adentroJugador, dObra\)/);
  assert.match(leer('src/desafio-sonidos.js'), /aranazo: \(pos\)/);
  assert.match(leer('src/desafio-sonidos.js'), /puerta: \(pos\)/);
}

// ======================================================== 5. se apagan las luces
{
  assert.ok(ESPECIALES.apagon, 'la noche sin luces es una noche especial');
  // las tres de siempre siguen saliendo igual que antes
  assert.equal(nocheEspecial(6, 0.05), 'roja');
  assert.equal(nocheEspecial(6, 0.15), 'eclipse');
  assert.equal(nocheEspecial(6, 0.25), 'silenciosa');
  assert.equal(nocheEspecial(6, 0.33), 'apagon');
  assert.equal(nocheEspecial(6, 0.5), null);
  assert.equal(nocheEspecial(6, 0.33, 'roja'), null, 'nunca dos seguidas');
  assert.equal(N.esperaApagon(0), Infinity);
  assert.ok(N.esperaApagon(1, () => 0.5) < N.esperaApagon(6, () => 0.5), 'cuanto más oscuro, más rápido');
  assert.equal(N.brilloTitileo(0), 1);
  assert.equal(N.brilloTitileo(N.TITILEO_APAGON), 0);
  const medio = N.brilloTitileo(N.TITILEO_APAGON / 2);
  assert.ok(medio >= 0 && medio <= 0.6, 'mientras tiembla, alumbra menos');
  assert.match(leer('src/desafio-defensas.js'), /function titilarYApagar/);
  assert.match(des, /defensas\.titilarYApagar\(/);
  assert.equal(sanearDesafio({ especial: 'apagon' }).especial, 'apagon', 'se guarda');
}

// ======================================================== 6. subtítulos con dirección
{
  const j = { x: 0, z: 0 }, mira = { x: 0, z: -1 };
  assert.equal(S.subtituloSonido({ clave: 'acecho', pos: { x: -40, z: -40 }, jugador: j, mira }), '[gruñido lejos · noroeste]');
  assert.equal(S.subtituloSonido({ clave: 'respiro', pos: { x: 0, z: 4 }, jugador: j, mira }), '[respiración encima · detrás tuyo]');
  assert.equal(S.subtituloSonido({ clave: 'chillido', pos: { x: 10, z: 0 }, jugador: j, mira }), '[risita cerca · este]');   // 3.8.0: los duendes se ríen
  assert.equal(S.subtituloSonido({ clave: 'nada', pos: { x: 10, z: 0 }, jugador: j }), null);
  let l = [];
  l = S.apilarSubtitulo(l, '[a]', 0); l = S.apilarSubtitulo(l, '[a]', 0.5); l = S.apilarSubtitulo(l, '[b]', 1);
  assert.deepEqual(l.map(S.renglonSubtitulo), ['[a] ×2', '[b]'], 'lo repetido se cuenta');
  l = S.apilarSubtitulo(l, null, 10);
  assert.equal(l.length, 0, 'y se borran solos');
  for (let i = 0; i < 9; i++) l = S.apilarSubtitulo(l, `[${i}]`, 20);
  assert.equal(l.length, S.MAX_SUBTITULOS);
  // todo lo que suena de noche pasa por oir; el perro, a mano (suena en el perro, se escribe hacia la amenaza)
  assert.match(des, /S\[clave\] = \(\.\.\.args\) => \{ const r = original\(\.\.\.args\); oir\(clave, args\[0\]\); return r; \}/);
  assert.match(des, /A_MANO = new Set\(\['grunirPerro', 'ladrarPerro'\]\)/);
  for (const k of ['chillido', 'acecho', 'respiro', 'latido', 'escupir', 'derrumbe', 'aranazo', 'puerta', 'pasos']) {
    assert.ok(S.SONIDOS_ESCRITOS[k], `${k} se escribe`);
    assert.match(leer('src/desafio-sonidos.js'), new RegExp(`${k}: `), `${k} existe en el banco`);
  }
  assert.match(leer('src/guardado.js'), /sonidosEscritos: true/);
  assert.match(leer('src/plantilla.html'), /id="sonidos-escritos"/);
}

// ======================================================== 7. la mezcla se agacha
{
  const cerca = S.agacheDeMezcla('chillido', 2), lejos = S.agacheDeMezcla('chillido', 12);
  assert.ok(cerca.profundidad > lejos.profundidad && cerca.sostener > lejos.sostener);
  assert.equal(S.agacheDeMezcla('chillido', 30), null, 'de lejos no');
  assert.ok(S.agacheDeMezcla('jefe', 40), 'el jefe se impone de más lejos');
  assert.equal(S.agacheDeMezcla('madera', 2), null, 'los golpes no agachan nada');
  assert.ok(S.agacheDeMezcla('jefe', 0).profundidad <= 0.75, 'nunca se apaga todo');
  const son = leer('src/sonido.js');
  assert.match(son, /agachar\(profundidad = 0\.5, sostener = 0\.6\)/);
  assert.match(son, /this\.bus\[n\]\.connect\(n === 'efectos' \? this\.master : this\.agaches\[n\]\)/, 'los efectos no se agachan: son el grito');
}

// ======================================================== 8. el bestiario
{
  const b = {};
  let r = N.anotarBestiario(b, 'rastreador', 'visto', 3);
  assert.ok(r.nuevo);
  assert.match(N.fichaBestiario('rastreador', b.rastreador).texto, /cuatro patas/);
  assert.ok(!/Punto débil/.test(N.fichaBestiario('rastreador', b.rastreador).texto), 'visto no es conocido');
  r = N.anotarBestiario(b, 'rastreador', 'abatido');
  assert.ok(r.aprendido && !r.nuevo);
  assert.match(N.fichaBestiario('rastreador', b.rastreador).texto, /No le des la espalda/);
  N.anotarBestiario(b, 'rastreador', 'abatido');
  r = N.anotarBestiario(b, 'rastreador', 'abatido');
  assert.ok(r.debil, 'al tercero, el punto débil');
  const f = N.fichaBestiario('rastreador', b.rastreador);
  assert.ok(f.completa && /Punto débil/.test(f.texto) && f.falta === '');
  assert.equal(N.fichaBestiario('bruto', undefined), null);
  assert.deepEqual(N.anotarBestiario(b, 'dragon', 'visto'), { nuevo: false, debil: false });
  assert.deepEqual(N.sanearBestiario({ rastreador: { vistos: -3, abatidos: '2', dia: 0 }, dragon: {} }), { rastreador: { vistos: 0, abatidos: 2, dia: 1 } });
  assert.deepEqual(sanearDesafio({ bestiario: { tirador: { vistos: 1, abatidos: 0, dia: 2 } } }).bestiario, { tirador: { vistos: 1, abatidos: 0, dia: 2 } });
  assert.match(main, /pestanas\.push\(\['bestiario', 'Bestiario'\]\)/);
  // en medio de una oleada se anotan cuatro de golpe: un solo aviso, para no tapar la campana
  assert.match(des, /esperaBestiario = 20;/);
  assert.ok(!/ctx\.nota\(`Bestiario: /.test(des), 'ningún aviso suelto por cada ficha');
  for (const t of ['rastreador', 'tirador', 'bruto', 'saltador', 'escupidor', 'jefe']) assert.ok(N.BESTIARIO[t], `${t} tiene ficha`);
}

// ======================================================== 9. las noches después
{
  const d = desafioNuevo();
  d.victoria = true; d.nido = { caido: true };
  assert.equal(siguenLasNoches(d), false, 'con el nido caído, se termina');
  d.despues = N.empezarDespues();
  assert.equal(siguenLasNoches(d), true, 'salvo que elijas las noches después');
  for (let i = 1; i < N.NOCHES_DESPUES; i++) assert.equal(N.sumarNocheDespues(d.despues), false);
  assert.equal(N.sumarNocheDespues(d.despues), true, 'son cinco');
  assert.equal(siguenLasNoches(d), false, 'y después sí se termina');
  assert.equal(N.sumarNocheDespues(d.despues), false);
  assert.ok(N.probabilidadMutado(0) >= 0.5 && N.probabilidadMutado(4) > N.probabilidadMutado(0) && N.probabilidadMutado(99) <= 0.95);
  const a = { mutado: true, vida: 50, vidaMax: 100, sinGolpe: 1 };
  assert.equal(N.regeneracion(a, 1), 0, 'mientras le pegan no se cura');
  a.sinGolpe = 5;
  assert.ok(N.regeneracion(a, 1) > 0, 'si lo dejás respirar, sí');
  assert.equal(N.regeneracion({ ...a, mutado: false }, 1), 0);
  assert.equal(N.regeneracion({ ...a, vida: 100 }, 1), 0);
  assert.deepEqual(N.sanearDespues({ activo: true, noches: 9 }), { activo: true, noches: N.NOCHES_DESPUES, terminado: true });
  assert.equal(N.sanearDespues(null), null);
  assert.equal(sanearDesafio({}).despues, null);
  assert.match(leer('src/plantilla.html'), /id="victoria-despues"/);
  assert.match(des, /a\.m\.mutar\(true\)/);
  assert.match(alien, /mutar\(si\)/);
}

// ======================================================== 10. la vibración del mando
{
  const fuerte = S.pulsoVibracion('herido', 1), suave = S.pulsoVibracion('herido', 0.1);
  assert.ok(fuerte.fuerte > suave.fuerte && fuerte.duracion > suave.duracion);
  assert.equal(S.pulsoVibracion('chillido', 1).fuerte, 0, 'un chillido es un cosquilleo, no un golpe');
  assert.equal(S.pulsoVibracion('nada'), null);
  for (const e of ['herido', 'caido', 'chillido', 'jefe', 'derrumbe', 'golpe']) {
    const p = S.pulsoVibracion(e, 1);
    assert.ok(p.fuerte <= 1 && p.debil <= 1 && p.duracion > 0 && p.duracion <= 1000, `${e} dentro de rango`);
  }
  // no zumba sin parar
  const p = { ...S.pulsoVibracion('golpe', 0.5), desde: 0 };
  assert.equal(S.dejarVibrar(p, S.pulsoVibracion('golpe', 0.5), 10), false);
  assert.equal(S.dejarVibrar(p, S.pulsoVibracion('herido', 1), 10), true, 'uno más fuerte pasa por encima');
  assert.equal(S.dejarVibrar(p, S.pulsoVibracion('golpe', 0.5), 1000), true);
  assert.match(main, /playEffect\('dual-rumble'/);
  assert.match(leer('src/guardado.js'), /vibracion: true/);
  assert.match(des, /ctx\.vibrar\?\.\(d\.salud <= 0 \? 'caido' : 'herido'/);
}

// ======================================================== el fantasma de las fotos de noche
// El perro muerde un poquito en cada cuadro; si cada mordida prendiera el destello
// entero, el invasor quedaría blanco todo el rato.
assert.match(des, /a\.flash = Math\.max\(a\.flash, Math\.min\(1, dano \/ 6\)\)/);
assert.ok(!/\n    a\.flash = 1;/.test(des), 'ya no se prende entero con cualquier rasguño');

console.log('desafío 2.0: ok · las diez mejoras (ojos, acecho, perro, asedio, luces, subtítulos, mezcla, bestiario, noches después, vibración)');
