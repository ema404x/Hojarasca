// 2.5: el arsenal del Desafío, en Node. La lógica pura (desafio-arsenal.js), cómo se
// suma a las armas, al taller y al guardado, y que el juego lo tenga enganchado.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as A from '../src/desafio-arsenal.js';
import { ARMAS, MEJORAS, RECETAS, CATEGORIAS_TALLER, armaEfectiva, sanearDesafio, desafioNuevo } from '../src/desafio-reglas.js';
import { SE_LLEVA } from '../src/desafio-vuelta.js';
import { armarMochila } from '../src/mochila.js';

const leer = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const casi = (a, b, e = 1e-6) => assert.ok(Math.abs(a - b) < e, `${a} ≈ ${b}`);

// ---------------------------------------------------------------- 1. las armas y el taller
{
  for (const id of Object.keys(A.ARSENAL)) assert.ok(ARMAS[id], `${id} está entre las armas`);
  for (const id of Object.keys(A.MEJORAS_ARSENAL)) assert.ok(MEJORAS[id], `${id} está entre las mejoras`);
  const ids = new Set(RECETAS.map((r) => r.id));
  assert.equal(ids.size, RECETAS.length, 'no hay recetas repetidas');
  for (const r of A.RECETAS_ARSENAL) {
    assert.ok(CATEGORIAS_TALLER.some((c) => c.clave === r.cat), `${r.id}: la categoría ${r.cat} existe`);
    assert.ok(Object.keys(r.pide).length && r.texto, `${r.id} pide algo y tiene texto`);
  }
  for (const c of CATEGORIAS_TALLER) assert.ok(RECETAS.filter((r) => r.cat === c.clave).length <= 9, `${c.clave}: nueve o menos (los números del teclado)`);
  // lo que se fabrica una vez, se lleva a la otra vuelta
  for (const r of A.RECETAS_ARSENAL.filter((x) => x.da.cosa)) assert.ok(SE_LLEVA.includes(r.da.cosa), `${r.da.cosa} se lleva a la otra vuelta`);
  const rep = armaEfectiva('ballesta', { ballesta: 1, ballestaRepeticion: 1 });
  assert.equal(rep.rafaga, 3); assert.equal(rep.cadencia, 2.4); assert.equal(rep.municion, 'virotes');
  assert.ok(armaEfectiva('boleadoras', { boleadoras: 1, boleadorasCristal: 1 }).descarga, 'las boleadoras de cristal descargan');
}

// ---------------------------------------------------------------- 2. flechas y carcaj
{
  const d = { flechas: 2, flechasFuego: 0, flechasCristal: 3, flechaTipo: 'comun' };
  assert.equal(A.tipoFlecha(d), 'comun'); assert.equal(A.flechasDe(d), 2);
  assert.equal(A.siguienteFlecha(d), 'cristal', 'salta la que no tiene');
  assert.equal(A.siguienteFlecha({ ...d, flechaTipo: 'cristal' }), 'comun');
  assert.equal(A.siguienteFlecha({ flechas: 0, flechasFuego: 0, flechasCristal: 0 }), 'comun', 'sin flechas se queda');
  assert.equal(A.tipoFlecha({ flechaTipo: 'constructor' }), 'comun', 'un nombre heredado no es una flecha');
  assert.deepEqual(A.factorTension(0.1), { dano: 1, vel: 1, k: 0 }, 'un clic corto es un tiro común');
  const lleno = A.factorTension(5); casi(lleno.dano, 1.6); casi(lleno.vel, 1.35);
  assert.ok(A.factorTension(0.6).dano > 1 && A.factorTension(0.6).dano < 1.6);
}

// ---------------------------------------------------------------- 3. defensa personal y daño
{
  assert.equal(A.conQueBloquea('lanza', { lanza: 1 }), 'lanza');
  assert.equal(A.conQueBloquea('facon', { facon: 1 }), null, 'sin escudo, el facón no bloquea');
  assert.equal(A.conQueBloquea('facon', { facon: 1, rodela: 1 }), 'rodela');
  assert.equal(A.conQueBloquea('maza', { rodela: 1 }), null, 'la maza es de dos manos');
  assert.equal(A.conQueBloquea('arco', { rodela: 1 }), null);
  assert.deepEqual(A.danoConArmadura(20, {}, {}, 3), { dano: 20, placas: false });
  assert.deepEqual(A.danoConArmadura(20, { chaleco: 1 }, {}, 3), { dano: 16, placas: false });
  assert.deepEqual(A.danoConArmadura(20, { chaleco: 1, placasCristal: 1 }, { placasNoche: 2 }, 3), { dano: 0, placas: true }, 'el primer golpe de la noche');
  assert.deepEqual(A.danoConArmadura(20, { chaleco: 1, placasCristal: 1 }, { placasNoche: 3 }, 3), { dano: 16, placas: false }, 'el segundo ya no');
  const bruto = { pesado: true }, chico = {};
  assert.equal(A.danoContra(A.ARSENAL.maza, bruto, 55), 55 * 1.5); assert.equal(A.danoContra(A.ARSENAL.maza, chico, 55), 55);
  assert.equal(A.danoPorEspalda(A.ARSENAL.facon, 22, { porDetras: true }), 44); assert.equal(A.danoPorEspalda(A.ARSENAL.facon, 22, { porDetras: false }), 22);
  assert.equal(A.danoPorEspalda(A.ARSENAL.maza, 55, { porDetras: true }), 55, 'sólo el facón');
  assert.equal(A.danoDeExplosion(75, 4, 0), 75); assert.equal(A.danoDeExplosion(75, 4, 4), 0);
  assert.ok(A.danoDeExplosion(75, 4, 3.9) > 20, 'en el borde todavía lastima');
}

// ---------------------------------------------------------------- 4. el guardado
{
  const n = desafioNuevo();
  for (const k of A.MUNICIONES) assert.equal(n[k], 0, `${k} arranca en cero`);
  assert.equal(n.flechaTipo, 'comun'); assert.equal(n.placasNoche, -1);
  const s = sanearDesafio({ virotes: '7', flechasFuego: -3, granadas: 1e9, flechaTipo: 'toString', placasNoche: 'x', bengalas: 2.9 });
  assert.equal(s.virotes, 7); assert.equal(s.flechasFuego, 0); assert.equal(s.granadas, A.TOPE_MUNICION); assert.equal(s.bengalas, 2);
  assert.equal(s.flechaTipo, 'comun'); assert.equal(s.placasNoche, -1);
  assert.equal(sanearDesafio({ flechaTipo: 'cristal' }).flechaTipo, 'cristal');
  assert.equal(sanearDesafio(null).virotes, 0, 'una partida vieja arranca sin munición nueva');
}

// ---------------------------------------------------------------- 5. la barra
{
  const p = { modo: 'desafio', entradas: {}, materiales: {}, ramitas: 0,
    cosas: { arco: 1, carcaj: 1, hacha: 1, ballesta: 1, facon: 1, granada: 1, cuerno: 1 },
    desafio: { ...desafioNuevo(), flechas: 3, flechasCristal: 5, flechaTipo: 'cristal', virotes: 4, granadas: 2 } };
  const b = armarMochila(p, {});
  const ids = b.map((r) => r.id);
  assert.ok(ids.indexOf('linterna') < ids.indexOf('ballesta') && ids.indexOf('hacha') < ids.indexOf('ballesta'), 'el arsenal va después de la linterna y el hacha');
  const arco = b.find((r) => r.id === 'arco');
  assert.equal(arco.cuenta, 5, 'el arco cuenta las flechas elegidas'); assert.match(arco.nombre, /doradas/);   // 3.8.0: las de cristal son doradas
  assert.equal(b.find((r) => r.id === 'ballesta').cuenta, 4);
  assert.equal(new Set(ids).size, ids.length, 'nada repetido en la barra');
}

// ---------------------------------------------------------------- 6. enganchado en el juego
{
  const des = leer('src/desafio.js'), main = leer('src/main.js'), mundo = leer('src/desafio-arsenal-mundo.js');
  assert.match(des, /arsenal = crearArsenalMundo\(T, escena, efectos, sonido, api\);/);
  assert.match(des, /const ea = arsenal\.estadoAlien\(a, dt, js\);/, 'los estados del arsenal en cada invasor');
  // 3.8.0: el duende que huye con lo robado tampoco ataca
  assert.match(des, /if \(a\.estado === 'avanzar' && !sinAtaque(?: && !a\.robo)?\) \{/, 'confundido no ataca');
  assert.match(des, /if \(arsenal\.alPegar\(q, a\) === 'sigue'\) \{ \(q\.golpeados \|\|= new Set\(\)\)\.add\(a\); continue; \}/, 'lo que atraviesa sigue');
  assert.match(des, /if \(q\.deJugador\) \{ q\.terminado = true; arsenal\.alTerminar\(q, fin\); \}/);
  assert.match(des, /n \*= bloqueando === 'rodela' \? RODELA\.pasa : 0\.25;/, 'el escudo frena menos que la lanza');
  assert.match(des, /const arm = danoConArmadura\(n, progreso\(\)\.cosas \|\| \{\}, d, d\.oleadas\);/, 'la armadura');
  assert.match(des, /for \(const k of \['flechas', 'cargas', 'emplastos', 'boleadoras', \.\.\.MUNICIONES\]\)/, 'el taller suma la munición nueva');
  assert.match(main, /if \(id === 'arco' && desafio\.cambiarFlecha\(\)\) \{ refrescarBarra\(true\); return; \}/, 'clic derecho con el carcaj');
  assert.match(main, /if \(desafio\.puedeBloquear\(id\)\) \{ desafio\.bloquear\(true, id\); return; \}/, 'clic derecho con el escudo');
  assert.match(main, /if \(id === 'arco' && desafio\.tensar\(\)\) return;/, 'el arco se tensa');
  const tiene = (txt, trozo, msg) => assert.ok(txt.includes(trozo), msg || trozo);
  tiene(main, "if (ranuras[elegida]?.id === 'arco' && modo === 'jugando'", 'sale al soltar, sólo si seguís con el arco');
  // la revisión de la 2.6
  tiene(des, 'herirAlien(a, arsenal.danoProyectil(q, a), _desde.copy(_p0)', 'el tramo del proyectil no se corrompe al atravesar');
  tiene(mundo, "if (!vivo(a)) return (q.atraviesa || 0) > 0 ? (q.atraviesa--, 'sigue') : 'fin';", 'atraviesa aunque el primero muera');
  tiene(main, 'desafio.cambioDeArma?.();   // 2.5: se suelta el arco', 'cambiar de arma suelta la cuerda y corta la ráfaga');
  tiene(des, 'if (abrir) cambioDeArma();', 'y abrir el taller también');
  assert.ok(main.indexOf('if (desafio.atacarAlterno(id))') < main.indexOf('if (desafio.puedeBloquear(id)) { desafio.bloquear(true, id); return; }'), 'la pistola cargada antes que el escudo');
  assert.ok(!A.UNA_MANO.includes('hacha'), 'el hacha sigue talando con clic derecho');
  tiene(mundo, 'api.obraEnPunto?.(nx, T.altura(nx, nz) + 1, nz)) { a.arrastre = null;', 'el arpón no arrastra a través de las paredes');
  tiene(mundo, 'get bengalas() { return hayBengalas; }', 'sin un filter por invasor y por cuadro');
  tiene(mundo, 'matHalo.clone()', 'cada bengala se apaga sola');
  tiene(des, 'Math.min(MUNICIONES.includes(k) ? TOPE_MUNICION : 999', 'el taller y el guardado, con el mismo tope');
  tiene(des, "case 'arpon':\n        recarga = arma.cadencia;", 'la cadencia del arpón es la de la tabla');
  assert.match(mundo, /if \(enElSuelo\.length > 40\) return;/, 'tope de lo que queda en el suelo');
  assert.match(leer('src/desafio-aliados.js'), /function llamar\(\)/, 'el cuerno llama a los compañeros');
  assert.match(leer('src/desafio-defensas.js'), /function estallarCerca\(pos, radio\)/, 'el fuego de lejos hace estallar los barriles');
}

console.log(`2.5: el arsenal · ${Object.keys(A.ARSENAL).length} armas, ${Object.keys(A.MEJORAS_ARSENAL).length + 1} mejoras, ${A.RECETAS_ARSENAL.length} recetas nuevas, ${A.MUNICIONES.length} municiones`);
