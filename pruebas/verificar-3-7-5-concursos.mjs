// 3.7.5 (noticias): los concursos de las fiestas (concursos.js y concursos-juego.js): el dulce, la trucha, el poncho y la
// foto, con cinta y un regalo útil; el jurado de vecinos, los vecinos que compiten, el guardado y el enganche.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as C from '../src/concursos.js';
import * as F from '../src/fiestas.js';
import { crearConcursosJuego } from '../src/concursos-juego.js';
import { esVecinoAldea, esPobladorAldea } from '../src/aldea.js';
import { COMIDAS, ALACENA_EXTRA } from '../src/cocina-pasos.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, t) => { assert.ok(c, t); n++; };

// ---------------------------------------------------------------- qué hay
ok(C.ORDEN_CONCURSOS.join() === 'dulce,trucha,poncho,foto', 'los cuatro concursos del plan');
for (const c of Object.values(C.CONCURSOS)) {
  ok(Object.keys(c.compiten).length >= 4 && Object.keys(c.compiten).every((k) => esVecinoAldea(k) || esPobladorAldea(k)), `${c.id}: compiten vecinos de verdad`);
  ok(c.jurado.length >= 5 && c.jurado.every((k) => (esVecinoAldea(k) || esPobladorAldea(k)) && !Object.hasOwn(c.compiten, k)), `${c.id}: el jurado son vecinos que no compiten`);
  ok([1, 2, 3].every((p) => C.regaloDe(c.id, p)?.texto) && C.regaloDe(c.id, 4) === null, `${c.id}: un regalo para cada uno de los tres primeros`);
  // el regalo es de lo que ya existe (sin economía nueva): cosas que se cuentan y materiales
  for (const p of [1, 2, 3]) {
    const r = C.regaloDe(c.id, p);
    ok(Object.keys(r).every((k) => ['cuenta', 'materiales', 'texto'].includes(k)) && Object.keys(r.cuenta || {}).every((k) => ['azucar', 'cacao', 'sal', 'yerba', 'harina'].includes(k)) && Object.keys(r.materiales || {}).every((k) => ['lana', 'tabla', 'tronco', 'piedra'].includes(k)), `${c.id}: el regalo ${p} es útil y de lo que hay`);
  }
}
ok(Object.keys(C.DULCES).every((k) => Object.hasOwn(COMIDAS, k) || Object.hasOwn(ALACENA_EXTRA, k)), 'los dulces son los de la alacena (la cocina de la 3.7.2)');
ok(C.CINTAS.map((c) => c.id).join() === 'azul,roja,blanca' && C.cintaDe(7).id === 'verde', 'cintas: azul, roja y blanca; los demás, mención');

// ---------------------------------------------------------------- en qué fiesta
ok(C.concursoDeFecha(F.fechaDe(2), 2) === 'trucha' && C.concursoDeFecha(F.fechaDe(6), 6) === 'dulce' && C.concursoDeFecha(F.fechaDe(12), 12) === 'poncho' && C.concursoDeFecha(F.fechaDe(4), 4) === 'foto', 'cada fiesta, su concurso');
ok(C.concursoDeFecha({ id: 'otra-fiesta', tipo: 'fiesta' }, 2) === 'trucha' && C.concursoDeFecha({ id: 'otra-fiesta', tipo: 'fiesta' }, 6) === 'dulce' && C.concursoDeFecha({ id: 'minga', tipo: 'minga' }, 2) === null && C.concursoDeFecha(null, 3) === null, 'una fiesta de otro id va por su estación; lo que no es fiesta, sin concurso');
const act = F.actividadesDeFiesta(F.fechaDe(6), 6).filter((a) => a.tipo === 'concurso');
ok(act.length === 1 && act[0].tipo === 'concurso' && act[0].concurso === 'dulce' && act[0].organiza === 'nelida' && act[0].hasta === C.HORAS_CONCURSO.fallo, 'actividadesDeFiesta suma el concurso (el gancho de fiestas.js)');

// ---------------------------------------------------------------- lo que llevás
ok(C.entradaDulce({ entradas: {}, cosas: {} }) === null, 'sin dulce, nada');
const pd = { entradas: { 'frasco-frutilla': { cantidad: 1 }, 'dulce-leche': { cantidad: 1 } }, cosas: {}, cocina: { hechas: { 'dulce-leche': 3 } } };
const ed = C.entradaDulce(pd);
ok(ed.k === 'dulce-leche' && ed.calidad === 70 + 6 && ed.que === 'un frasco de dulce de leche', 'el mejor dulce, con la mano que tenés');
ok(C.entradaDulce({ entradas: {}, cosas: {}, cocina: { hechas: { 'dulce-leche': 50 } }, ...{ entradas: { 'dulce-leche': { cantidad: 1 } } } }).calidad === 70 + C.MANO_DULCE.tope, 'la mano tiene tope');
const et = C.concursosNuevo();
ok(C.anotarTrucha(et, { id: 'marron', cm: 60 }, 5) && C.anotarTrucha(et, { id: 'arcoiris', cm: 41 }, 7) && !C.anotarTrucha(et, { id: 'perca', cm: 44 }, 7), 'se anotan las truchas (la perca no es trucha)');
ok(C.entradaTrucha(et, 7).cm === 41 && C.entradaTrucha(et, 6).cm === 60 && C.entradaTrucha(et, 8).cm === 41 && C.entradaTrucha(et, 9) === null, 'la más grande de hoy o ayer');
ok(C.puntosTrucha(20) === 30 && C.puntosTrucha(72) === 98 && C.puntosTrucha(200) === 100, 'la trucha: por centímetro');
ok(C.entradaPoncho({ cosas: {} }) === null && C.entradaPoncho({ cosas: { poncho: 1 } }).calidad === C.MANO_PONCHO.base && C.entradaPoncho({ cosas: { poncho: 3 } }).calidad === C.MANO_PONCHO.base + 8, 'el poncho, del telar');
const pf = { desafios: { 'f-molino': { dia: 2 }, 'f-huemul': { dia: 4 }, 'f-fogata': { dia: 11 } } };
ok(C.entradaFoto(pf, 6, { 'f-huemul': 'El huemul con poca luz' }).k === 'f-huemul' && /«El huemul con poca luz»/.test(C.entradaFoto(pf, 6, { 'f-huemul': 'El huemul con poca luz' }).que), 'la foto: la mejor del álbum');
ok(C.entradaFoto({ desafios: { 'f-molino': { dia: 6 } } }, 6).calidad === C.FOTO_BASE + C.FOTO_FIESTA && /sacada en la fiesta/.test(C.entradaFoto({ desafios: { 'f-molino': { dia: 6 } } }, 6).que), 'la sacada en la fiesta suma');

// ---------------------------------------------------------------- anotarse y el fallo
const e = C.concursosNuevo();
ok(!C.inscribir(e, 'dulce', ed, 7, 8) && !C.inscribir(e, 'dulce', ed, 7, 17), 'te anotás de 9 a 17');
ok(C.inscribir(e, 'dulce', ed, 7, 12) && !C.inscribir(e, 'dulce', ed, 7, 13), 'una vez por concurso');
const todos = () => true;
const f = C.fallar(e, 'dulce', 7, todos);
ok(f && f.jurado.length === 3 && new Set(f.jurado).size === 3 && f.tabla.length === Object.keys(C.CONCURSOS.dulce.compiten).length + 1, 'tres jurados; compiten los vecinos y vos');
ok(f.tabla.every((x, i) => x.puesto === i + 1 && (i === 0 || f.tabla[i - 1].puntos >= x.puntos)), 'la tabla, de mayor a menor');
ok(f.puesto >= 1 && e.cintas.length === 1 && e.cintas[0].cinta === C.cintaDe(f.puesto).id && e.inscripto === null, 'tu cinta queda guardada');
ok(C.fallar(e, 'dulce', 7, todos) === null, 'el fallo, una vez');
ok(JSON.stringify(C.juzgar('dulce', 7, { presentes: todos, jugador: ed })) === JSON.stringify(C.juzgar('dulce', 7, { presentes: todos, jugador: ed })), 'el mismo día y lo mismo llevado: el mismo fallo');
// un dulce excelente gana casi siempre; uno flojo, casi nunca
let gana = 0, pierde = 0;
for (let d = 1; d <= 60; d++) {
  if (C.juzgar('dulce', d, { presentes: todos, jugador: { calidad: 96, que: 'x' } }).puesto === 1) gana++;
  if (C.juzgar('dulce', d, { presentes: todos, jugador: { calidad: 40, que: 'x' } }).puesto <= 3) pierde++;
}
ok(gana >= 54 && pierde <= 3, `lo bueno gana (${gana}/60) y lo flojo no (${pierde}/60)`);
// los pobladores que no llegaron no compiten ni juzgan
const soloVecinos = (k) => esVecinoAldea(k);
const fv = C.juzgar('trucha', 3, { presentes: soloVecinos });
ok(fv.tabla.every((x) => esVecinoAldea(x.quien)) && fv.jurado.every((k) => esVecinoAldea(k)) && fv.jurado.length === 3 && fv.puesto === 0 && fv.regalo === null, 'sin pobladores, compiten y juzgan los vecinos; sin anotarte, sin cinta');
const t = C.textoFallo(f, (k) => k.toUpperCase());
ok(t.titulo.length > 5 && t.texto.startsWith(`El jurado (${f.jurado.map((k) => k.toUpperCase()).join(', ')}): cinta azul, `), `lo que dice el jurado («${t.titulo}»)`);
ok(/^En el concurso de dulces se llevó la cinta azul /.test(C.noticiaDeResultado(e.resultados[0], (k) => k)), 'la noticia para la radio y el diario');
const fJ = C.juzgar('dulce', 7, { presentes: todos, jugador: { calidad: 100, que: 'x' } });
if (fJ.puesto === 1) ok(/^¡Cinta azul en el concurso de dulces!$/.test(C.textoFallo(fJ).titulo) && fJ.regalo === C.regaloDe('dulce', 1), 'la cinta azul y su regalo');

// ---------------------------------------------------------------- el saneo
ok(JSON.stringify(C.sanearConcursos(null)) === JSON.stringify(C.concursosNuevo()), 'sin nada: nuevo');
const s = C.sanearConcursos({ inscripto: { id: 'dulce', dia: 4, k: 'dulce-leche', que: 'x', calidad: 500 }, truchas: [{ dia: 3, cm: 999, especie: 'marron' }, { dia: 99, cm: 30, especie: 'marron' }, { dia: 2, cm: 30, especie: 'tiburon' }], resultados: [{ id: 'dulce', dia: 3, podio: ['jugador', 'madre', 'falso'], puesto: 1, jurado: ['jefe'] }, { id: 'dulce', dia: 3 }, { id: 'nada', dia: 2 }], cintas: [{ id: 'poncho', dia: 2, puesto: 2, cinta: 'oro', que: '<i>x</i>' }, { id: 'foto', dia: 50 }] }, 5);
ok(s.inscripto === null, 'la inscripción de otro día ya no vale');
ok(s.truchas.length === 1 && s.truchas[0].cm === 120, 'truchas: nada del futuro, sólo truchas, con tope');
ok(s.resultados.length === 1 && s.resultados[0].podio.join() === 'jugador,madre', 'resultados: uno por día y concurso, gente de verdad');
ok(s.cintas.length === 1 && s.cintas[0].cinta === 'roja' && s.cintas[0].que === 'ix/i', 'la cinta sale del puesto (no del guardado)');
ok(C.sanearConcursos({ inscripto: { id: 'dulce', dia: 5, k: 'dulce-leche', que: 'x', calidad: 70 } }, 5).inscripto?.calidad === 70, 'la de hoy, sí');

// ---------------------------------------------------------------- el juego (sin mundo)
const notas = [], cobros = [];
const prog = { dia: 6, horas: 12, aldea: { descubierta: 1, pobladores: [] }, entradas: { 'dulce-leche': { cantidad: 2 } }, cosas: {}, cocina: { hechas: {} }, desafios: {} };
const J = crearConcursosJuego({ progreso: () => prog, desafio: () => false, nota: (a, b) => notas.push([a, b]), guardar: () => {}, cobrar: (x) => cobros.push(x) });
ok(J.deHoy() === 'dulce' && J.hablar({ clave: 'jefe' }) === null, 'sólo anota Nélida');
let h = J.hablar({ claveAldea: 'nelida' });
ok(h && h.id === 'concurso-anotar' && /Veo que traés un frasco de dulce de leche/.test(h.partes[0]) && typeof h.alTerminar === 'function', 'Nélida ofrece anotarte con lo que traés');
h.alTerminar();
ok(prog.concursos.inscripto?.id === 'dulce' && prog.entradas['dulce-leche'].cantidad === 1 && /^Te anotaste en el concurso de dulces/.test(notas[notas.length - 1][0]), 'anotado: el frasco queda en la mesa');
ok(J.hablar({ claveAldea: 'nelida' }) === null, 'anotado, no te lo repite: la charla de siempre');
J.actualizar(1);
ok(!prog.concursos.resultados.length, 'antes de las 17, sin fallo');
prog.horas = 17.2; J.actualizar(1);
ok(prog.concursos.resultados.length === 1 && prog.concursos.cintas.length === 1 && notas.length >= 2, 'a las 17, el fallo y la cinta');
const pu = prog.concursos.cintas[0].puesto;
ok(pu <= 3 ? cobros.length === 1 && cobros[0].premio === C.regaloDe('dulce', pu) : cobros.length === 0, 'el regalo útil, si quedaste entre los tres');
ok(/^En el concurso de dulces se llevó la cinta azul/.test(J.noticiaReciente(6)) && J.noticiaReciente(8) === null, 'la noticia, hoy y mañana');
prog.dia = 8; prog.horas = 12;
ok(J.hablar({ claveAldea: 'nelida' }) === null, 'sin concurso, Nélida es Nélida');
J.delPez({ id: 'marron', cm: 55 });
ok(prog.concursos.truchas.length === 1, 'las truchas se anotan para el concurso');
prog.dia = 18; prog.horas = 12;
let dm = J.destinos();
ok(dm.size === 1 && dm.get('nelida')?.edificio === 'plaza', 'el día del concurso, Nélida atiende la mesa en la plaza');
prog.horas = 16.5; dm = J.destinos();
ok(dm.size >= 6 && [...dm.keys()].includes('madre') && [...dm.values()].every((d) => d.lugar === 'concurso'), 'la hora antes del fallo, el jurado y los que compiten');
prog.horas = 17.5; J.actualizar(1);
ok(J.destinos().size === 0, 'después del fallo, cada uno a lo suyo');

// ---------------------------------------------------------------- enganchado
const main = leer('src/main.js');
ok(main.includes("import { crearConcursosJuego } from './concursos-juego.js';") && main.includes('if (!desafio) concursosJuego?.actualizar(dt);') && main.includes('concursosJuego?.delPez(pez);') && main.includes('cobrar: (e) => cobrarPremio(e)'), 'main.js: los concursos, la trucha y el regalo');
ok(leer('src/fiestas.js').includes("import { actividadesDeConcurso } from './concursos.js';"), 'fiestas.js: el gancho de los concursos');
console.log(`OK 3.7.5 (concursos): ${n} comprobaciones`);
