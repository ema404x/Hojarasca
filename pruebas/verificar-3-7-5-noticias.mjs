// 3.7.5 (noticias): la radio por horarios, el diario de la aldea, las cartas de lejos y el calendario (noticias.js,
// calendario.js y lo que junta noticias-juego.js), el guardado y cómo se engancha en main.js, aldea-gente.js y guardado.js.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as N from '../src/noticias.js';
import * as K from '../src/calendario.js';
import * as F from '../src/fiestas.js';
import * as J from '../src/noticias-juego.js';
import { RITMOS } from '../src/aldea-vida.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, t) => { assert.ok(c, t); n++; };

// ---------------------------------------------------------------- la radio por horarios
ok(N.PROGRAMAS_RADIO.length === 5 && N.PROGRAMAS_RADIO.every((p, i, l) => p.desde < p.hasta && (!i || l[i - 1].hasta === p.desde)), 'la grilla: cinco programas seguidos, sin huecos');
ok(N.programaDeHora(8).id === 'tiempo' && N.programaDeHora(10).id === 'noticias' && N.programaDeHora(13).id === 'musica' && N.programaDeHora(15.5).id === 'chisme' && N.programaDeHora(18).id === 'avisos', 'cada hora, su programa');
ok(N.programaDeHora(21) === null && N.programaDeHora(3) === null && N.armarPrograma({ dia: 2, hora: 22 }) === null, 'de noche, la radio de siempre (los refugios lejanos)');
let pr = N.armarPrograma({ dia: 4, hora: 8, tiempo: ['Para hoy, lluvia a la tarde.', 'Para mañana, despejado.'] });
ok(pr.programa === 'tiempo' && /Buen día, valle\. Son las 8:00 en la Radio Comunitaria del Valle, FM 89\.5\. El tiempo: Para hoy, lluvia a la tarde\. Para mañana, despejado\./.test(pr.texto), `el tiempo sale del pronóstico («${pr.texto}»)`);
pr = N.armarPrograma({ dia: 4, hora: 10, novedades: ['Abrió la panadería.'] });
ok(/Las noticias del valle\. Abrió la panadería\./.test(pr.texto), 'las noticias del valle');
ok(/Sin novedades/.test(N.armarPrograma({ dia: 4, hora: 10 }).texto), 'sin novedades, lo dice');
pr = N.armarPrograma({ dia: 4, hora: 13 });
ok(N.MUSICA_RADIO.some((m) => pr.texto.includes(m)) && N.MUSICA_RADIO.some((m) => /chamamé/.test(m)) && N.MUSICA_RADIO.some((m) => /loncomeo/.test(m)), 'la música del sur (chamamé, loncomeo…)');
const chismes = ['uno.', 'dos.', 'tres.', 'cuatro.'];
const cuenta = (r) => chismes.filter((c) => N.armarPrograma({ dia: 9, hora: 15, ritmo: r, chismes }).texto.includes(c)).length;
ok(cuenta('tranquilo') === 1 && cuenta('normal') === 2 && cuenta('animado') === 3, 'los chismes, según el ritmo de la aldea (1, 2, 3)');
ok(N.armarPrograma({ dia: 9, hora: 15, chismes }).texto === N.armarPrograma({ dia: 9, hora: 15.9, chismes }).texto.replace('15:54', '15:00'), 'el mismo día, los mismos chismes');
ok(/Los avisos de la comunidad\. Mañana: fiesta\./.test(N.armarPrograma({ dia: 9, hora: 18, avisos: ['Mañana: fiesta.'] }).texto), 'los avisos de fiestas y concursos');

// ---------------------------------------------------------------- el diario
ok(N.DIARIO_ALDEA.cada.tranquilo > N.DIARIO_ALDEA.cada.normal && N.DIARIO_ALDEA.cada.normal > N.DIARIO_ALDEA.cada.animado, 'el diario sale más seguido con la aldea animada');
const est = N.noticiasNuevas();
ok(N.tocaDiario(est, 3, 'normal') && !N.tocaDiario(est, 2, 'normal'), 'el primero, al tercer día (ritmo normal)');
const ed = N.sacarDiario(est, 3, { novedades: ['Bajó del tren la panadera.', 'La obra va por la etapa 2.'], chismes: ['Un chisme.'], avisos: ['Mañana: concurso.'], tiempo: ['Para hoy, sol.'], concurso: 'Ganó Gladys.', club: 'El club lee Facundo.', presentes: (k) => k === 'herrero' });
ok(ed.n === 1 && ed.dia === 3 && ed.titulo === 'Bajó del tren la panadera.', 'la tapa es la primera novedad');
const secciones = ed.notas.map((x) => x.seccion);
ok(['La aldea', 'Concursos', 'El tiempo', 'Sociales', 'Club de lectura', 'Agenda', 'Clasificados de trueque'].every((s) => secciones.includes(s)), `todas las secciones (${secciones.join(', ')})`);
ok(ed.notas.find((x) => x.seccion === 'Clasificados de trueque').texto === N.CLASIFICADOS.find((c) => c.quien === 'herrero').texto, 'los clasificados, sólo de los que viven en la aldea (trueque y servicios)');
ok(!N.CLASIFICADOS.some((c) => /\$|peso|pesos|precio|vend/i.test(c.texto)), 'los clasificados no venden nada (sin economía nueva)');
ok(!N.tocaDiario(est, 5, 'normal') && N.tocaDiario(est, 6, 'normal') && N.tocaDiario(est, 5, 'animado'), 'el siguiente, a los días del ritmo');
for (let d = 6; d < 40; d += 3) N.sacarDiario(est, d, {});
ok(est.diarios.length === N.DIARIO_ALDEA.tope && est.numero === 13 && est.diarios[est.diarios.length - 1].titulo === 'Todo tranquilo en la aldea', 'se guardan las últimas ediciones; sin novedades, «Todo tranquilo»');

// ---------------------------------------------------------------- las cartas de lejos
ok(N.CARTAS_LEJANAS.length >= 8 && new Set(N.CARTAS_LEJANAS.map((c) => c.id)).size === N.CARTAS_LEJANAS.length, 'ocho cartas de lejos, ids únicos');
ok(N.CARTAS_LEJANAS.some((c) => c.tipo === 'familia') && N.CARTAS_LEJANAS.some((c) => c.tipo === 'antiguo'), 'de familiares y de antiguos habitantes');
ok(N.CARTAS_LEJANAS.every((c) => c.texto.length >= 2 && typeof c.llega === 'function' && c.desde >= 1), 'cada una con su texto y cuándo llega');
const sinAldea = { aldea: { descubierta: 0 }, entradas: {} };
const conAldea = { aldea: { descubierta: 2, pobladores: [] }, entradas: {}, vidaAldea: { familia: { cuenta: 0 } } };
const ec = N.noticiasNuevas();
ok(N.repartirCarta(ec, sinAldea, 20) === null, 'sin conocer la aldea no llega ninguna (no tienen dónde mandarla)');
const c1 = N.repartirCarta(ec, conAldea, 4, 'normal');
ok(c1?.id === 'l-mama' && N.repartirCarta(ec, conAldea, 5, 'normal') === null, 'la primera es de tu mamá; la siguiente, a los días del ritmo');
ok(N.repartirCarta(ec, conAldea, 8, 'normal')?.id === 'a-puestero', 'después, el puestero que vivió en tu refugio');
ok(N.cartasPorLeer(ec).length === 2 && N.leerCartaLejana(ec, 'l-mama', 9) && !N.leerCartaLejana(ec, 'l-mama', 9) && N.cartasPorLeer(ec).length === 1 && N.cartasLeidas(ec).length === 1, 'se leen una vez');
ok(/^Llegó carta para vos en la saca del tren\. Es de tu mamá, Susana\./.test(N.partesDeCartaLejana(N.CARTA_LEJANA['l-mama'], 'telegrafista')[0]) && /^Me la dejaron para vos en el almacén/.test(N.partesDeCartaLejana(N.CARTA_LEJANA['l-mama'], 'ercilia')[0]), 'te la da Benigno (o Ercilia)');
ok(N.CARTAS_CADA.tranquilo > N.CARTAS_CADA.normal && N.CARTAS_CADA.normal > N.CARTAS_CADA.animado, 'las cartas, más seguido con la aldea animada');

// ---------------------------------------------------------------- el saneo
ok(JSON.stringify(N.sanearNoticias(null)) === JSON.stringify(N.noticiasNuevas()), 'sin nada: nuevo');
const roto = N.sanearNoticias({ diarios: [{ n: 2, dia: 99, titulo: 'del futuro', notas: [] }, { n: 1, dia: 3, titulo: '<b>hola</b>', notas: [{ seccion: 'x', texto: 'y' }, 'basura'] }], numero: 'x', ultimoDiario: 999, cartas: { 'l-mama': { dia: 4, leida: 2 }, 'c-falsa': { dia: 1 }, constructor: { dia: 1 } }, club: [5, 5, 99, 'x', 3], oidos: { tiempo: 9, nada: 3 } }, 10);
ok(roto.diarios.length === 1 && roto.diarios[0].titulo === 'bhola/b' && roto.diarios[0].notas.length === 1 && roto.numero === 1 && roto.ultimoDiario === 10, 'nada del futuro, texto limpio');
ok(Object.keys(roto.cartas).join() === 'l-mama' && roto.cartas['l-mama'].leida === 0 && JSON.stringify(roto.club) === '[3,5]' && JSON.stringify(roto.oidos) === '{"tiempo":9}', 'sólo cartas que existen, leída antes de llegar no vale, días únicos');

// ---------------------------------------------------------------- el calendario
const aldea = { descubierta: 2, pobladores: [{ clave: 'astronoma' }], locales: { observatorio: 2 } };
const op = { aldea, fechas: F.FECHAS, ya: [] };
const delAnio = K.extrasDelAnio(1, op);
ok(delAnio.some((e) => e.tipo === 'fiesta') && delAnio.some((e) => e.tipo === 'aldea') && delAnio.some((e) => e.tipo === 'concurso') && delAnio.some((e) => e.tipo === 'club'), 'el año: fiestas, día de la aldea, concursos y club');
ok(K.extrasDelDia(13, op).some((e) => e.tipo === 'aniversario' && e.nombre === 'Aniversario de tu llegada (un año)') && !K.extrasDelDia(1, op).some((e) => e.id === 'aniversario'), 'el aniversario de tu llegada, desde el segundo año');
ok(K.extrasDelDia(14, op).some((e) => e.id === 'aniversario-aldea'), 'y el de cuando conociste la aldea');
ok(K.extrasDelDia(2, { ...op, ya: ['fiesta-verano'] }).every((e) => e.id !== 'fiesta-verano'), 'lo que ya está en FIESTAS_ALDEA no se repite');
const est6 = K.extrasDelDia(4, op);
ok(est6.some((e) => e.id === 'concurso-foto' && /En el día de la aldea:/i.test(e.texto)), 'el concurso de fotos va el día de la aldea («en el día…»)');
// las estrellas: los sábados (día de la semana 5) con el observatorio abierto, sin fiesta
const sabado = [6, 13, 20, 27].find((d) => !F.fechaDe(d));
ok(K.hayEstrellas(sabado, aldea, F.FECHAS) && !K.hayEstrellas(sabado, { ...aldea, locales: {} }, F.FECHAS), 'noche de estrellas sólo con el observatorio abierto');
ok(K.estrellasAhora(sabado, 21.5, aldea, F.FECHAS) && !K.estrellasAhora(sabado, 20, aldea, F.FECHAS), 'de 21 a 23');
ok(K.clubAhora(24, 18.5, aldea, []) && !K.clubAhora(24, 18.5, aldea, F.FECHAS) && !K.clubAhora(10, 17, aldea, F.FECHAS) && K.clubAhora(10, 18, aldea, F.FECHAS), 'el club, los miércoles de 18 a 19:30 (no en día de fiesta)');
ok(K.asistentes('club', 10, aldea).length === K.CLUB_LECTURA.asisten && !K.asistentes('club', 10, aldea).includes('abuela'), 'van unos cuantos vecinos (la abuela lo lleva)');
ok(K.libroDeLaSemana(1).id !== K.libroDeLaSemana(8).id && K.LIBROS_CLUB.length >= 4, 'un libro por semana');
const av = K.avisoMananaExtra(5, op);
ok(av && av.titulo === 'Mañana: fiesta de la Cosecha y el concurso de dulces' && /Anota Nélida/.test(av.texto), `el aviso del día antes (${av?.titulo})`);
ok(K.avisoMananaExtra(12, op)?.titulo.startsWith('Mañana: aniversario de tu llegada (un año)'), 'el aniversario también se avisa el día antes');
ok(K.avisoMananaExtra(4, { ...op, aldea: { ...aldea, locales: {} } }) === null, 'sin nada mañana, sin aviso');

ok(K.extrasDelDia(6, { aldea, fechas: F.fechaDe }).map((e) => e.id).join() === 'fiesta-cosecha,concurso-dulce' && K.hayClub(24, aldea, F.fechaDe) === false, 'también con el fechaDe de fiestas.js (no depende de cómo guarde las fechas)');

// ---------------------------------------------------------------- lo que junta el juego
const p = { dia: 5, aldea: { descubierta: 1, pobladores: [], locales: {} }, entradas: {} };
ok(J.chismesDelValle(p, 5).length > 3 && J.chismesDelValle(p, 5).every((t) => !/Benigno|Valentina/.test(t)), 'los chismes de los vecinos, sin nombrar a los que no llegaron');
ok(J.avisosDelValle(p, 3).some((t) => /^Mañana: día de la aldea/i.test(t)) && J.avisosDelValle(p, 3).some((t) => /^Club de lectura/.test(t)), 'los avisos: lo que viene y el club');
ok(J.novedadesDelValle(p, 6).some((t) => /^Hoy es fiesta de la cosecha/i.test(t)), 'las novedades: la fiesta de hoy');
ok(J.tiempoDelValle([{ cuando: 'Hoy', texto: 'Lluvia fuerte' }, { cuando: 'Mañana', texto: 'Sol' }]).join(' ') === 'Para hoy, lluvia fuerte. Para mañana, sol.', 'el tiempo del pronóstico');
ok(Object.keys(RITMOS).every((r) => Object.hasOwn(N.DIARIO_ALDEA.cada, r) && Object.hasOwn(N.CARTAS_CADA, r) && Object.hasOwn(N.CHISMES_POR_RITMO, r)), 'el ritmo de la aldea manda en el diario, las cartas y los chismes');

// ---------------------------------------------------------------- enganchado
const main = leer('src/main.js'), ag = leer('src/aldea-gente.js'), gu = leer('src/guardado.js');
ok(main.includes("import { crearNoticiasJuego } from './noticias-juego.js';") && main.includes('if (!desafio) noticiasJuego?.actualizar(dt);') && main.includes('const programa = noticiasJuego?.radio() || null;'), 'main.js: las noticias y la radio por horarios');
ok(main.includes("pestanas.push(['noticias', 'Noticias'])") && main.includes('noticiasJuego.dibujarCuaderno(ficha, el)'), 'main.js: la página «Noticias» del cuaderno');
ok(main.includes('const deAmor = !desafio ? amorJuego?.hablar(npc) : null;') && main.includes('const deNoticias = !desafio && !deAmor ? (concursosJuego?.hablar(npc) || noticiasJuego?.hablar(npc) || null) : null;'), 'main.js: lo que te dicen (después del amor)');
ok(main.includes('noticiasDestino: (k) => noticiasJuego?.destino(k) || null,') && ag.includes('const r = ctx.noticiasDestino(k);') && ag.includes('extras: eventosTaller(tren).concat(ctx.extrasCalendario?.(dia()) || [])'), 'aldea-gente.js: el club y las estrellas, y el calendario completo');
ok(gu.includes('noticias: sanearNoticias(p.noticias,') && gu.includes('noticias: noticiasNuevas(), concursos: concursosNuevo()') && gu.includes('noticias: undefined, concursos: undefined'), 'guardado.js: nuevo, saneado y nada en el Desafío');
for (const f of ['noticias.js', 'calendario.js', 'noticias-juego.js', 'concursos.js', 'concursos-juego.js']) {
  const t = leer(`src/${f}`);
  ok(!/\r/.test(t) && !/^export\s+(async\s+function|function\*|\{[^}]*\}\s+from)/m.test(t) && !/^import\s+['"]/m.test(t), `${f}: LF y los imports/exports que entiende armar.mjs`);
  ok(!/^export\s+(const|function|let)\s+[^\s(=]*ñ/m.test(t), `${f}: exportados sin ñ`);
  ok(!/\b(iglesia|misa|rezar|cura|santo|virgen|dios)\b/i.test(t), `${f}: nada religioso`);
}
console.log(`OK 3.7.5 (noticias): ${n} comprobaciones`);
