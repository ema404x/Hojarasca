// 3.0: el contraataque de día (los puestos de avanzada) y los invasores que evolucionan,
// en Node. Las reglas puras (desafio-puestos.js, desafio-evolucion.js), el guardado, y que
// el juego las tenga enganchadas (el mundo se prueba en pruebas/humo-3-0-contra.cjs).
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as P from '../src/desafio-puestos.js';
import * as E from '../src/desafio-evolucion.js';
import { sanearDesafio, desafioNuevo, composicionOleada } from '../src/desafio-reglas.js';
import { BESTIARIO, fichaBestiario, sanearBestiario } from '../src/desafio-noche2.js';
import { generador } from '../src/semilla.js';
import { azarDe } from '../src/semilla.js';
import { marcasAutomaticas } from '../src/chinches.js';
import { mapaDesafio } from '../src/desafio-mapa.js';

const leer = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const casi = (a, b, e = 1e-6) => assert.ok(Math.abs(a - b) < e, `${a} ≈ ${b}`);

// ---------------------------------------------------------------- 1. los puestos
{
  // cuándo aparecen: desde la noche 2, cada dos, con tope por etapa de la campaña
  assert.equal(P.tocaPuesto(1, 0), false);
  assert.equal(P.tocaPuesto(2, 0), true);
  assert.equal(P.tocaPuesto(3, 0), false);
  assert.equal(P.tocaPuesto(4, 1), true);
  assert.equal(P.tocaPuesto(4, 2), false, 'en la primera etapa, dos a la vez como mucho');
  assert.equal(P.maxPuestos(3), 2); assert.equal(P.maxPuestos(8), 3); assert.equal(P.maxPuestos(18), 4); assert.equal(P.maxPuestos(40), 4);
  let porEtapa = [0, 0, 0, 0];
  for (let n = 1; n <= 20; n++) if (P.tocaPuesto(n, 0)) porEtapa[P.etapaDe(n)]++;
  assert.ok(porEtapa.every((k) => k >= 2 && k <= 3), `unos pocos por etapa (${porEtapa})`);

  // dónde: con la misma semilla, el mismo lugar; lejos de la base, de los otros y del nido
  const centro = { x: 0, z: 0 };
  const a1 = P.lugarDelPuesto(centro, { azar: azarDe('COIHUE-4821', 2, 'puesto') });
  const a2 = P.lugarDelPuesto(centro, { azar: azarDe('COIHUE-4821', 2, 'puesto') });
  assert.deepEqual(a1, a2, 'la semilla del Desafío decide dónde');
  const d1 = Math.hypot(a1.x, a1.z);
  assert.ok(d1 >= P.PUESTOS.distancia[0] - 0.1 && d1 <= P.PUESTOS.distancia[1] + 0.1, `a ${d1.toFixed(0)} m de la base`);
  const otro = P.lugarDelPuesto(centro, { azar: generador(7), otros: [a1] });
  assert.ok(Math.hypot(otro.x - a1.x, otro.z - a1.z) >= P.PUESTOS.separacion, 'separados entre sí');
  // con el nido en el valle, salen de su lado
  const hacia = P.lugarDelPuesto(centro, { azar: generador(3), hacia: 0 });
  assert.ok(hacia.x > 0 && Math.abs(Math.atan2(hacia.z, hacia.x)) <= Math.PI / 3 + 1e-6, 'del lado del nido');
  assert.equal(P.lugarDelPuesto(centro, { esBueno: () => false }), null, 'sin lugar, no hay puesto');
  // con el mapa de la semilla (desafio-mapa.js): de sus lugares, el primero libre; mismo código, mismos puestos
  const mapa = mapaDesafio('COIHUE-4821');
  assert.ok(mapa.puestos.length >= 3, 'el mapa trae lugares para los puestos');
  const s1 = P.sitioDelPuesto(mapa.puestos), s2 = P.sitioDelPuesto(mapaDesafio('COIHUE-4821').puestos);
  assert.deepEqual(s1, s2, 'mismo código, mismo puesto');
  assert.deepEqual(s1, { x: mapa.puestos[0].x, z: mapa.puestos[0].z });
  const s3 = P.sitioDelPuesto(mapa.puestos, { usados: [s1] });
  assert.ok(s3 && (s3.x !== s1.x || s3.z !== s1.z), 'el lugar de uno roto no se repite');
  assert.equal(P.sitioDelPuesto(mapa.puestos, { esBueno: () => false }), null, 'sin lugar libre, al azar como antes');
  const cb = mapa.base, h = Math.atan2(mapa.puestos.at(-1).z - cb.z, mapa.puestos.at(-1).x - cb.x);
  const sh = P.sitioDelPuesto(mapa.puestos, { hacia: h, centro: cb });
  const ang = Math.atan2(sh.z - cb.z, sh.x - cb.x) - h;
  assert.ok(Math.abs(Math.atan2(Math.sin(ang), Math.cos(ang))) <= Math.PI / 3 + 1e-9, 'con el nido, primero los de su lado');

  // uno nuevo: aguja y vaina; crece si nadie lo toca y manda más
  const est = P.puestosNuevos();
  const p = P.puestoNuevo(est.proximoId++, { x: 100, z: 0 }, 2, generador(1));
  est.lista.push(p);
  assert.deepEqual(p.estructuras.map((e) => e.tipo), ['aguja', 'vaina']);
  assert.equal(p.guardias, 2);
  assert.deepEqual(P.guardiasDe(p), ['rastreador', 'tirador']);
  assert.equal(P.queMandan(est, generador(2))[0].tipos.length, 1, 'nivel 1: manda uno');
  assert.equal(P.crecerPuestos(est, 3, generador(4)).length, 0, 'todavía no');
  assert.equal(P.crecerPuestos(est, 4, generador(4)).length, 1, 'a las dos noches crece');
  assert.equal(p.nivel, 2);
  assert.ok(p.estructuras.some((e) => e.tipo === 'generador'), 'nivel 2: generador de cristal');
  P.crecerPuestos(est, 6, generador(5));
  assert.equal(p.nivel, 3);
  assert.equal(P.crecerPuestos(est, 20, generador(5)).length, 0, 'con tope');
  assert.deepEqual(P.queMandan(est, () => 0.9)[0].tipos, ['rastreador', 'tirador', 'bruto'], 'nivel 3: manda tres');
  assert.equal(p.guardias, 4);
  for (const e of p.estructuras) for (const q of p.estructuras) if (e !== q) assert.ok(Math.hypot(e.dx - q.dx, e.dz - q.dz) > 0.5, 'no se enciman');

  // romperlo: el generador blinda lo demás; con todo roto, el puesto cae
  const iAguja = p.estructuras.findIndex((e) => e.tipo === 'aguja');
  const iGen = p.estructuras.findIndex((e) => e.tipo === 'generador');
  const r1 = P.danarEstructura(p, iAguja, 40);
  assert.ok(r1.blindado && r1.dano === 20, 'con el generador en pie, la mitad');
  const r2 = P.danarEstructura(p, iGen, 999);
  assert.ok(r2.rota && !r2.destruido);
  assert.equal(P.danarEstructura(p, iAguja, 40).blindado, false, 'sin generador, entero');
  let ultimo = null;
  p.estructuras.forEach((e, i) => { if (e.vida > 0) ultimo = P.danarEstructura(p, i, 999); });
  assert.ok(ultimo.destruido && p.roto && !P.enPie(p), 'con todo roto, el puesto cae');
  assert.equal(P.danarEstructura(p, iAguja, 5).ok, false);
  assert.deepEqual(P.premioPuesto(3), { cristal: 8, piedra: 5, tabla: 4 }, 'cristales y materiales');

  // la noche siguiente vienen menos, desde ese lado (nunca el jefe, nunca menos de dos)
  const g = P.golpeDelPuesto(p, 6, { x: 0, z: 0 });
  assert.deepEqual([g.noche, g.menos], [7, 5]);
  casi(g.rumbo, Math.atan2(100, 0), 1e-3);
  est.golpes.push(g);
  const ole = composicionOleada(7);
  const rec = P.recortarOleada(ole, est, 7);
  assert.equal(rec.length, ole.length - 5, `vienen ${g.menos} menos (${ole.length} → ${rec.length})`);
  assert.deepEqual(P.recortarOleada(ole, est, 8), ole, 'sólo la noche siguiente');
  const conJefe = composicionOleada(10);
  est.golpes.push({ noche: 10, menos: 40, rumbo: 0 });
  const rj = P.recortarOleada(conJefe, est, 10);
  assert.ok(rj.includes('jefe') && rj.length === 2, `el jefe viene igual (${rj})`);
  assert.equal(P.queMandan(est).length, 0, 'el roto no manda nada');

  // la E: la vaina se quema con una ramita; al generador se le arranca el cristal
  assert.equal(P.usarEstructura('vaina', { ramitas: 1 }).accion, 'quemar');
  assert.equal(P.usarEstructura('vaina', { ramitas: 0 }).accion, 'sinRamitas');
  assert.equal(P.usarEstructura('vaina', { ramitas: 3, lluvia: 0.9 }).accion, 'mojado');
  assert.equal(P.usarEstructura('generador').accion, 'arrancar');
  assert.equal(P.usarEstructura('aguja').accion, 'nada');
  assert.match(P.avisoEstructura('vaina', { ramitas: 1 }), /Quemar la bolsa de esporas/);   // 3.8.0
  assert.equal(P.avisoEstructura('aguja'), null, 'la aguja no tiene E: se rompe a golpes');

  // el guardado: basura afuera, lo bueno se queda
  const s = P.sanearPuestos({ lista: [p, { x: 'a' }, { x: 1, z: 2, estructuras: [{ tipo: 'torre', vida: 3 }] }, { x: 5, z: 5, estructuras: [{ tipo: 'vaina', vida: 9999 }], nivel: 9, guardias: -3 }], golpes: [g, { noche: 'x' }], proximoId: 0 });
  assert.equal(s.lista.length, 2);
  assert.equal(s.lista[0].roto, true);
  assert.deepEqual([s.lista[1].nivel, s.lista[1].guardias, s.lista[1].estructuras[0].vida], [3, 0, 80]);
  assert.ok(s.proximoId > Math.max(...s.lista.map((q) => q.id)));
  assert.equal(s.golpes.length, 1);
  assert.deepEqual(P.sanearPuestos(null), P.puestosNuevos());
}

// ---------------------------------------------------------------- 2. la evolución
{
  // las clases de daño, desde la fuente de siempre de herirAlien y el arma
  assert.equal(E.claseDeDano('fuego'), 'fuego'); assert.equal(E.claseDeDano('zanja'), 'fuego');
  assert.equal(E.claseDeDano('trampa'), 'trampas'); assert.equal(E.claseDeDano('foso'), 'trampas'); assert.equal(E.claseDeDano(null), 'trampas', 'las estacas');
  assert.equal(E.claseDeDano('torreta'), 'torretas'); assert.equal(E.claseDeDano('lanza'), 'cuerpo'); assert.equal(E.claseDeDano('jugador'), 'cuerpo');
  assert.equal(E.claseDeDano('perro'), null, 'el perro no es tu táctica');
  assert.equal(E.claseDeDano('jugador', 'cristal'), 'cristal'); assert.equal(E.claseDeDano('jugador', 'inventado'), 'cuerpo');
  assert.equal(E.claseDeProyectil({ tipo: 'flecha', flechaTipo: 'fuego' }), 'fuego');
  assert.equal(E.claseDeProyectil({ tipo: 'flecha', flechaTipo: 'cristal' }), 'cristal');
  assert.equal(E.claseDeProyectil({ tipo: 'flecha', flechaTipo: 'comun' }), 'flechas');
  assert.equal(E.claseDeProyectil({ tipo: 'virote' }), 'flechas'); assert.equal(E.claseDeProyectil({ tipo: 'jabalina' }), 'flechas');
  assert.equal(E.claseDeProyectil({ tipo: 'granada' }), 'explosivos');
  assert.equal(E.claseDeProyectil({ tipo: 'perno', fuente: 'torreta' }), 'torretas');
  assert.equal(E.CLASES_DANO.length, 7);

  // aprenden de a un nivel, con tope, sólo desde la noche 3 y si una cosa domina
  const e = E.evolucionNueva();
  const noche = (n, reparto) => { for (const [c, v] of Object.entries(reparto)) E.anotarDano(e, c, v); return E.cerrarNocheEvolucion(e, n); };
  assert.equal(noche(1, { fuego: 900 }).subio, null, 'las primeras noches no aprenden');
  assert.equal(noche(3, { fuego: 60 }).subio, null, 'una noche tranquila no enseña');
  assert.equal(noche(3, { fuego: 300, flechas: 300, cuerpo: 300 }).subio, null, 'sin táctica dominante, nada');
  assert.equal(noche(3, { fuego: 500, flechas: 200 }).subio, 'fuego');
  noche(4, { fuego: 500 }); noche(5, { fuego: 500 }); noche(6, { fuego: 500 });
  assert.equal(e.niveles.fuego, E.EVOLUCION.tope, 'con tope');
  assert.deepEqual(e.noche, {}, 'lo de la noche se vacía al amanecer');
  // lo que se ve al atardecer
  const aviso = E.avisoAtardecer(e);
  assert.equal(aviso.titulo, 'Vienen resistentes al fuego');
  assert.equal(E.avisoAtardecer(E.evolucionNueva()), null);
  // cuántos vienen así y cuánto les entra: justo, nunca inmunes
  let adaptados = 0;
  const azar = generador(11);
  for (let i = 0; i < 4000; i++) if (E.elegirAdaptacion(e, azar) === 'fuego') adaptados++;
  casi(adaptados / 4000, E.EVOLUCION.porcion[3], 0.03);
  assert.ok(E.EVOLUCION.porcion[3] <= 0.5 && E.EVOLUCION.resistencia[3] <= 0.5, 'al tope, la mitad de la oleada y la mitad del daño');
  assert.equal(E.elegirAdaptacion(e, () => 0, true), null, 'el jefe no se adapta');
  casi(E.factorResistencia('fuego', 'fuego', 3), 0.5);
  assert.equal(E.factorResistencia('fuego', 'flechas', 3), 1, 'contra lo demás, nada');
  assert.equal(E.factorResistencia(null, 'fuego', 3), 1);
  // si cambiás de táctica, se olvidan (y nunca más de dos a la vez)
  let c = noche(7, { flechas: 600 });
  assert.equal(c.subio, 'flechas'); assert.deepEqual(c.bajaron, ['fuego']);
  assert.deepEqual(e.niveles, { fuego: 2, flechas: 1 });
  c = noche(8, { cuerpo: 600 });
  assert.equal(Object.keys(e.niveles).length, 2, `dos a la vez como mucho (${JSON.stringify(e.niveles)})`);
  assert.ok(e.niveles.cuerpo === 1 && e.niveles.fuego === 1 && !e.niveles.flechas, JSON.stringify(e.niveles));
  noche(9, { trampas: 50 }); noche(10, {});
  assert.deepEqual(e.niveles, {}, 'sin pelear, se les olvida todo');
  assert.match(E.avisoAprendizaje({ subio: 'fuego', bajaron: [] }).texto, /resistentes al fuego/);
  assert.match(E.avisoAprendizaje({ subio: null, bajaron: ['flechas'] }).texto, /no usaste las flechas/);
  assert.equal(E.avisoAprendizaje({ subio: null, bajaron: [] }), null);

  // el guardado
  const g = E.sanearEvolucion({ niveles: { fuego: 7, flechas: 2, cuerpo: 1, veneno: 3 }, noche: { fuego: 12.34, foo: 4, flechas: -2 }, ultimo: { subio: 'fuego', bajaron: ['x', 'cuerpo'] } });
  assert.deepEqual(g.niveles, { fuego: 3, flechas: 2 }, 'tope y dos a la vez');
  assert.deepEqual(g.noche, { fuego: 12.3 });
  assert.deepEqual(g.ultimo.bajaron, ['cuerpo']);
  assert.deepEqual(E.sanearEvolucion('basura'), E.evolucionNueva());

  // el bestiario: una ficha nueva que se anota como las demás
  assert.ok(BESTIARIO.adaptado && BESTIARIO.mutado, 'la ficha del adaptado, sin pisar las de antes');
  assert.ok(fichaBestiario('adaptado', { vistos: 1, abatidos: 3, dia: 5 }).completa);
  assert.deepEqual(sanearBestiario({ adaptado: { vistos: 2, abatidos: 1, dia: 4 } }).adaptado, { vistos: 2, abatidos: 1, dia: 4 });
  assert.match(E.textoAdaptaciones({ niveles: { fuego: 2 } }), /resistentes al fuego \(nivel 2/);
}

// ---------------------------------------------------------------- 3. el guardado del Desafío
{
  const nuevo = desafioNuevo();
  assert.deepEqual(nuevo.evolucion, E.evolucionNueva());
  assert.deepEqual(nuevo.puestos, P.puestosNuevos());
  // una partida de antes de la 3.0 carga igual
  const viejo = sanearDesafio({ oleadas: 7, noches: 6, flechas: 12 });
  assert.deepEqual(viejo.evolucion, E.evolucionNueva()); assert.deepEqual(viejo.puestos, P.puestosNuevos());
  assert.equal(viejo.oleadas, 7);
  const ida = sanearDesafio({ evolucion: { niveles: { fuego: 2 } }, puestos: { lista: [{ id: 3, x: 10, z: 20, estructuras: [{ tipo: 'aguja', vida: 90 }], visto: true }], proximoId: 4 } });
  const vuelta = sanearDesafio(JSON.parse(JSON.stringify(ida)));
  assert.deepEqual(vuelta.evolucion, ida.evolucion); assert.deepEqual(vuelta.puestos, ida.puestos, 'ida y vuelta por el guardado');
  assert.equal(vuelta.puestos.lista[0].estructuras[0].vida, 90);
}

// ---------------------------------------------------------------- 4. el mapa
{
  const m = marcasAutomaticas({ desafio: { puestos: [{ x: 5, z: 6 }] } });
  assert.deepEqual(m.map((q) => [q.nombre, q.clase]), [['madriguera de duendes', 'puesto']]);
  assert.deepEqual(marcasAutomaticas({ desafio: { puestos: null } }), []);
  assert.match(leer('src/mapa.js'), /a\.clase === 'puesto'/, 'el mapa dibuja el puesto');
}

// ---------------------------------------------------------------- 5. enganchado en el juego
{
  const des = leer('src/desafio.js');
  const tiene = (txt, msg) => assert.ok(des.includes(txt), msg);
  tiene("import { crearPuestosMundo } from './desafio-puestos-mundo.js';", 'los puestos en el mundo');
  tiene("import { crearEvolucionMundo } from './desafio-evolucion-mundo.js';", 'la evolución en el mundo');
  tiene('a.resiste = null; a.nivelResiste = 0; a.puesto = null;', 'el invasor reciclado no trae la adaptación ni el puesto de su vida anterior');
  tiene('evolucion.alBajar(a);', 'al bajar se decide si viene adaptado');
  tiene('dano = evolucion.golpe(a, dano, fuente, clase);', 'herirAlien anota con qué y aplica la resistencia');
  tiene('claseDeProyectil(q));', 'lo que tiraste dice su clase');
  tiene("impactoEn(g.a, _w.x, _w.y, _w.z, origen), 'cristal');", 'la pistola es cristal');   // 3.8.2: con de dónde viene el golpe
  tiene('evolucion.alAtardecer();', 'el aviso del atardecer');
  tiene('evolucion.alAmanecer();', 'aprenden al amanecer');
  tiene('puestos.alAmanecer();', 'los puestos crecen y aparecen al amanecer');
  tiene('tipos = puestos.recortar(tipos);', 'la noche después de romper uno vienen menos');
  tiene('puestos.alEmpezarNoche();', 'y los que siguen en pie mandan lo suyo');
  assert.match(leer('src/desafio-puestos-mundo.js'), /sitioDelPuesto\(sitios,/, 'el mundo usa los lugares del mapa de la semilla');
  tiene('eventos.blancos = () => puestos.conBlancos(blancosDeEventos());', 'las estructuras son blancos como las cámaras del nido');
  tiene('puestos.golpear(js, arma.alcance + 0.8, arma.dano * bono)', 'y se rompen a golpes');
  tiene("if (a.resiste) anotarEnBestiario('adaptado', 'visto');", 'el bestiario anota a los adaptados');
  // la E: en el uso y en el aviso, en el mismo orden
  const usar = /usarCercaDe: \(pos, dPuerta\) => (.+),\n/.exec(des)[1].split('||').map((x) => x.trim().replace(/^usar|^avisoCerca|\(.*$/g, ''));
  const aviso = /avisoCercaDe: \(pos, dPuerta\) => (.+),\n/.exec(des)[1].split('||').map((x) => x.trim().replace(/^aviso|\(.*$/g, ''));
  assert.deepEqual(usar.map((x) => x.replace(/Cerca$|\.usarCerca$/, '').toLowerCase()), aviso.map((x) => x.replace(/Cerca$|\.avisoCerca$/, '').toLowerCase()), `la E y su aviso en el mismo orden (${usar} / ${aviso})`);
  assert.ok(usar.some((x) => /puestos/.test(x)), 'la E sirve en los puestos');
  // los módulos puros no importan three
  for (const f of ['src/desafio-puestos.js', 'src/desafio-evolucion.js']) {
    const t = leer(f);
    assert.ok(!/from 'three'/.test(t) && !/document\.|window\./.test(t), `${f} es puro`);
    assert.ok(!/export (const|function) [\w$]*ñ/.test(t), `${f}: sin eñes en lo exportado`);
    for (const l of t.split('\n').filter((x) => /^import /.test(x))) assert.match(l, /^import \{ [^}]+ \} from '\.\/[\w-]+\.js';$/, `${f}: un import por línea`);
  }
  assert.match(leer('src/desafio-reglas.js'), /evolucion: sanearEvolucion\(x\.evolucion\),/);
  assert.match(leer('src/desafio-reglas.js'), /puestos: sanearPuestos\(x\.puestos\),/);
  assert.match(leer('src/main.js'), /t === 'adaptado' && desafio\.adaptaciones/, 'el bestiario dice contra qué vienen');
}

console.log(`3.0: contraataque de día · puestos cada ${P.PUESTOS.cada} noches desde la ${P.PUESTOS.desdeNoche} · evolución hasta nivel ${E.EVOLUCION.tope} (${E.EVOLUCION.porcion[3] * 100}% de la oleada, ${E.EVOLUCION.resistencia[3] * 100}% menos)`);
